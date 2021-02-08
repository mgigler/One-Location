import os
from flask import Flask, jsonify, request, abort
from flask_cors import CORS
import csv
import psycopg2
import random
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from shapely.geometry import Point
from shapely.geometry.polygon import Polygon
from sqlalchemy import func
import colorsys

import dynamicPriceFactors
import datetime
from datetime import timedelta
from . import create_app
from models.rest_models import *
from utils.helper_methods import get_Month
import dateutil

app = create_app()
CORS(app)


@app.route('/', methods=['GET'])
def hello_world():
    return 'Hello World!'


@app.errorhandler(404)
def resource_not_found(e):
    return jsonify(error=str(e)), 404


# example-request: {"from":"Maxvorstadt", "to":"Sendling", "date": "2020-01-13T15:45:45.000Z", "checkboxOptions":{ "mvv": true, "weather": false, "availability": true, "airbnb": true, "traffic": true}}
@app.route('/price-factors', methods=['GET', 'POST'])
def get_price_factors():
    content = request.json
    # date
    date = datetime.datetime.strptime(content['date'], '%Y-%m-%dT%H:%M:%S.%fZ')
    # route
    start = Region.query.filter_by(region_name=content['from']).scalar()
    destination = Region.query.filter_by(region_name=content['to']).scalar()
    start_polygon = to_shape(start.coordinates)
    destination_polygon = to_shape(destination.coordinates)
    start_center = start_polygon.centroid
    destination_center = destination_polygon.centroid
    # when driving within the region search a representative point for an approximation
    if start_center == destination_center:
        destination_center = destination_polygon.representative_point()
    res = dynamicPriceFactors.single_route_distance(start_center, destination_center,
                                                    content['checkboxOptions']['traffic'])
    # mvv
    if content['checkboxOptions']['mvv']:
        res.update({"mvv": dynamicPriceFactors.get_mvv_duration(start_center, destination_center, date)})
    price = res['sharenow']
    # availability
    if content['checkboxOptions']['availability'] or content['checkboxOptions']['airbnb']:
        start_summary = dynamicPriceFactors.get_availability_by_date(start.region_number, content['date'])
        destination_summary = dynamicPriceFactors.get_availability_by_date(destination.region_number, content['date'])
        if content['checkboxOptions']['availability']:
            start_availability = round(start_summary['car_avg_availability'], 2)
            destination_availability = round(destination_summary['car_avg_availability'], 2)
            provision = round(dynamicPriceFactors.get_provision(start, destination, start_availability,
                                                                destination_availability) * 0.2, 2)
            price -= provision
            res.update({'availability':
                            {'start_availability': start_availability,
                             'destination_availability': destination_availability,
                             'provision': provision
                             }
                        })
        # airbnb
        if content['checkboxOptions']['airbnb']:
            res.update({'airbnb':
                {
                    'start_booked_airbnbs': start_summary['number_of_booked_airbnbs'],
                    'start_existing_airbnbs': start_summary['number_of_existing_airbnbs'],
                    'start_occupancy_rate': dynamicPriceFactors.divide(start_summary['number_of_booked_airbnbs'],
                                                                       start_summary['number_of_existing_airbnbs']),
                    'destination_booked_airbnbs': destination_summary['number_of_booked_airbnbs'],
                    'destination_existing_airbnbs': destination_summary['number_of_existing_airbnbs'],
                    'destination_occupancy_rate': dynamicPriceFactors.divide(
                        destination_summary['number_of_booked_airbnbs'],
                        destination_summary['number_of_existing_airbnbs'])
                }
            })
    res.update({'price': round(price, 2)})
    # weather
    if content['checkboxOptions']['weather']:
        weather = dynamicPriceFactors.get_weather(start_center, date)
        res.update({"weather": weather})
        # Modal split
        if content['checkboxOptions']['mvv'] and weather is not None and res['mvv'] is not None:
            res.update({'modalSplit': dynamicPriceFactors.get_modal_split(price, 3.3, res['duration'], res['mvv']['duration'],
                                                                          dynamicPriceFactors.get_cycling_duration(start_center, destination_center), weather['fair-weather'])})
            return res
        # Modal split
    if content['checkboxOptions']['mvv'] and res['mvv'] is not None:
        res.update({'modalSplit': dynamicPriceFactors.get_modal_split(price, 3.3, res['duration'],
                                                        res['mvv']['duration'], res['distance'])})
    return res

# array index isn't equal to region number anymore, since they are sorted for the frontend
@app.route('/dynamic-price-matrix', methods=['GET'])
def price_matrix():
    region_list = []
    center_list = []
    regions = Region.query.order_by(Region.region_name).distinct().all()
    for r in regions:
        region_list.append(r.region_name)
        center_list.append(to_shape(r.coordinates).centroid)
    matrix = dynamicPriceFactors.get_distance_matrix(center_list)
    rs = jsonify({'matrix': matrix, 'districts': region_list})
    return rs


@app.route('/airbnb', methods=['GET'])
def getairbnblocations():
    result = AirbnbLocation.query.limit(1000).all()
    rs = jsonify({'airbnb_listings': [r.serialize() for r in result]})
    return rs


@app.route('/airbnb_by_date', methods=['GET'])
def getairbnblocationsbydate():
    date_param = request.args['date']
    try:
        date = datetime.datetime.strptime(date_param, "%Y-%m-%d")
    except:
        return "Check date format. %Y-%m-%d is required"
    # result = AirbnbCalendar.query.filter_by(date=date).all()

    query = """select ac.airbnb_id, al."location" from airbnb_calendar ac, airbnb_location al where ac.airbnb_id = al.airbnb_id and ac.availability = false and ac."date" = '""" + date.strftime(
        "%Y-%m-%d") + """'"""
    result = db.session.execute(query)

    rs_list = []
    for ele in result:
        rs_list.append(AirbnbCalendarObj(ele[0], ele[1]))

    rs = jsonify({'airbnb_listings': [r.serialize() for r in rs_list]})
    return rs


@app.route('/airbnb_sharenow_number', methods=['GET'])
def getairbnbsharenownumber():
    first_date_param = request.args['first_date']
    last_date_param = request.args['last_date']

    try:
        first_date = datetime.datetime.strptime(first_date_param, "%Y-%m-%d")
        last_date = datetime.datetime.strptime(last_date_param, "%Y-%m-%d")
    except:
        return "Check date format. %Y-%m-%d is required. Make sure first_date and last_date parameters are included."

    if 'region' in request.args and 'first_hour' in request.args:
        region_param = request.args['region']
        first_hour_param = request.args['first_hour']
        last_hour_param = request.args['last_hour']
        try:
            first_hour = datetime.datetime.strptime(first_hour_param, '%H').time()
            last_hour = datetime.datetime.strptime(last_hour_param, '%H').time()
        except:
            return "Check time format. %H is required. Make sure first_hour and last_hour parameters are included."

        region = Region.query.filter_by(region_name=region_param).scalar()
        no_cars_in_region_query = db.session.execute("""
            with datetimerange as (
                SELECT car_id, time_2_end
                FROM sample_data
                where time_2_end::date >= '""" + first_date.strftime("%Y-%m-%d") + """'
                and time_2_end::date <= '""" + last_date.strftime("%Y-%m-%d") + """'
                and extract(hour from time_2_end) >= """ + str(first_hour.hour) + """
                and extract(hour from time_2_end) <= """ + str(last_hour.hour) + """
                and district_2 = """ + str(region.id) + """
            ), car_result as (
                select time_2_end::date, extract(hour from time_2_end)::int as hour, count(sd.id) as car_count
                from sample_data sd
                INNER join (SELECT car_id, MAX(time_2_end) AS MaxDateTime
                FROM datetimerange
                GROUP BY car_id) groupedsd
                ON sd.car_id = groupedsd.car_id 
                AND sd.time_2_end = groupedsd.MaxDateTime
                group by time_2_end::date, extract(hour from time_2_end)
                order by time_2_end asc, hour asc 
            ), all_dates as (
                with dates as (
                    select generate_series(date '""" + first_date.strftime(
            "%Y-%m-%d") + """' , date '""" + last_date.strftime("%Y-%m-%d") + """', interval '1 day')::date as gen_date
                ), hours as (
                    select generate_series(""" + str(first_hour.hour) + """ , """ + str(last_hour.hour) + """,  1) as gen_time
                )
                select *
                from dates, hours
                )
            select all_dates.gen_date, all_dates.gen_time, coalesce(car_count, 0) as number_of_cars
            from all_dates 
            left join car_result on all_dates.gen_date = car_result.time_2_end and all_dates.gen_time = car_result.hour
            order by all_dates.gen_date asc , all_dates.gen_time asc
        """)

        no_booked_airbnb_in_region_query = db.session.execute("""
            with all_dates as (
                with dates as (
                    select generate_series(date '""" + first_date.strftime(
            "%Y-%m-%d") + """' , date '""" + last_date.strftime("%Y-%m-%d") + """', interval '1 day')::date as gen_date
                ), hours as (
                    select generate_series(""" + str(first_hour.hour) + """ , """ + str(last_hour.hour) + """,  1) as gen_time
                )
                select *
                from dates, hours
            ), airbnb_date as 
                (select ac."date", count(ac.id) as number_of_airbnbs
                from airbnb_calendar ac, airbnb_location al
                where ac."date" >= '""" + first_date.strftime("%Y-%m-%d") + """'
                and ac."date"::date <= '""" + last_date.strftime("%Y-%m-%d") + """'
                and al.region_id = """ + str(region.id) + """
                and ac.airbnb_id = al.airbnb_id
                and ac.availability = false
                group by ac."date"
                order by ac."date" asc)
            select all_dates.gen_date, all_dates.gen_time, coalesce(airbnb_date.number_of_airbnbs, 0) as booked_airbnbs
            from all_dates
            left join airbnb_date on all_dates.gen_date = airbnb_date."date"
            order by all_dates.gen_date asc , all_dates.gen_time asc
        """)
    elif 'first_hour' in request.args:

        first_hour_param = request.args['first_hour']
        last_hour_param = request.args['last_hour']
        try:
            first_hour = datetime.datetime.strptime(first_hour_param, '%H').time()
            last_hour = datetime.datetime.strptime(last_hour_param, '%H').time()
        except:
            return "Check time format. %H is required. Make sure first_hour and last_hour parameters are included."
        no_cars_in_region_query = db.session.execute("""
        with datetimerange as (
                SELECT car_id, time_2_end
                FROM sample_data
                where time_2_end::date >= '""" + first_date.strftime("%Y-%m-%d") + """'
                and time_2_end::date <= '""" + last_date.strftime("%Y-%m-%d") + """'
                and extract(hour from time_2_end) >= """ + str(first_hour.hour) + """
                and extract(hour from time_2_end) <= """ + str(last_hour.hour) + """
            ), car_result as (
                select time_2_end::date, extract(hour from time_2_end)::int as hour, count(sd.id) as car_count
                from sample_data sd
                INNER join (SELECT car_id, MAX(time_2_end) AS MaxDateTime
                FROM datetimerange
                GROUP BY car_id) groupedsd
                ON sd.car_id = groupedsd.car_id 
                AND sd.time_2_end = groupedsd.MaxDateTime
                group by time_2_end::date, extract(hour from time_2_end)
                order by time_2_end asc, hour asc 
            ), all_dates as (
                with dates as (
                    select generate_series(date '""" + first_date.strftime(
            "%Y-%m-%d") + """' , date '""" + last_date.strftime("%Y-%m-%d") + """', interval '1 day')::date as gen_date
                ), hours as (
                    select generate_series(""" + str(first_hour.hour) + """ , """ + str(last_hour.hour) + """,  1) as gen_time
                )
                select *
                from dates, hours
                )
            select all_dates.gen_date, all_dates.gen_time, coalesce(car_count, 0) as number_of_cars
            from all_dates 
            left join car_result on all_dates.gen_date = car_result.time_2_end and all_dates.gen_time = car_result.hour
            order by all_dates.gen_date asc , all_dates.gen_time asc
        """)
        no_booked_airbnb_in_region_query = db.session.execute("""
            with all_dates as (
                with dates as (
                    select generate_series(date '""" + first_date.strftime(
            "%Y-%m-%d") + """' , date '""" + last_date.strftime("%Y-%m-%d") + """', interval '1 day')::date as gen_date
                ), hours as (
                    select generate_series(""" + str(first_hour.hour) + """ , """ + str(last_hour.hour) + """,  1) as gen_time
                )
                select *
                from dates, hours
            ), airbnb_date as 
                (select ac."date", count(ac.id) as number_of_airbnbs
                from airbnb_calendar ac, airbnb_location al
                where ac."date" >= '""" + first_date.strftime("%Y-%m-%d") + """'
                and ac."date"::date <= '""" + last_date.strftime("%Y-%m-%d") + """'
                and ac.airbnb_id = al.airbnb_id
                and ac.availability = false
                group by ac."date"
                order by ac."date" asc)
            select all_dates.gen_date, all_dates.gen_time, coalesce(airbnb_date.number_of_airbnbs, 0) as booked_airbnbs
            from all_dates
            left join airbnb_date on all_dates.gen_date = airbnb_date."date"
            order by all_dates.gen_date asc , all_dates.gen_time asc
        """)
    elif 'region' in request.args:

        region_param = request.args['region']
        region = Region.query.filter_by(region_name=region_param).scalar()
        no_cars_in_region_query = db.session.execute("""
        with datetimerange as (
                SELECT car_id, time_2_end
                FROM sample_data
                where time_2_end::date >= '""" + first_date.strftime("%Y-%m-%d") + """'
                and time_2_end::date <= '""" + last_date.strftime("%Y-%m-%d") + """'
                and district_2 = """ + str(region.id) + """
            ), car_result as (
                select time_2_end::date, count(sd.id) as car_count
                from sample_data sd
                INNER join (SELECT car_id, MAX(time_2_end) AS MaxDateTime
                FROM datetimerange
                GROUP BY car_id) groupedsd
                ON sd.car_id = groupedsd.car_id 
                AND sd.time_2_end = groupedsd.MaxDateTime
                group by time_2_end::date
                order by time_2_end asc
            ), all_dates as (
                with dates as (
                    select generate_series(date '""" + first_date.strftime(
            "%Y-%m-%d") + """' , date '""" + last_date.strftime("%Y-%m-%d") + """', interval '1 day')::date as gen_date
                )
                select *
                from dates
                )
            select all_dates.gen_date, coalesce(car_count, 0) as number_of_cars
            from all_dates 
            left join car_result on all_dates.gen_date = car_result.time_2_end 
            order by all_dates.gen_date asc 
        """)
        no_booked_airbnb_in_region_query = db.session.execute("""
        with all_dates as (
                with dates as (
                    select generate_series(date '""" + first_date.strftime(
            "%Y-%m-%d") + """' , date '""" + last_date.strftime("%Y-%m-%d") + """', interval '1 day')::date as gen_date
                )
                select *
                from dates
            ), airbnb_date as 
                (select ac."date", count(ac.id) as number_of_airbnbs
                from airbnb_calendar ac, airbnb_location al
                where ac."date" >= '""" + first_date.strftime("%Y-%m-%d") + """'
                and ac."date"::date <= '""" + last_date.strftime("%Y-%m-%d") + """'
                and al.region_id = """ + str(region.id) + """
                and ac.airbnb_id = al.airbnb_id
                and ac.availability = false
                group by ac."date"
                order by ac."date" asc)
            select all_dates.gen_date, coalesce(airbnb_date.number_of_airbnbs, 0) as booked_airbnbs
            from all_dates
            left join airbnb_date on all_dates.gen_date = airbnb_date."date"
            order by all_dates.gen_date asc
        """)
    else:
        no_cars_in_region_query = db.session.execute("""
                with datetimerange as (
                SELECT car_id, time_2_end
                FROM sample_data
                where time_2_end::date >= '""" + first_date.strftime("%Y-%m-%d") + """'
                and time_2_end::date <= '""" + last_date.strftime("%Y-%m-%d") + """'
            ), car_result as (
                select time_2_end::date, count(sd.id) as car_count
                from sample_data sd
                INNER join (SELECT car_id, MAX(time_2_end) AS MaxDateTime
                FROM datetimerange
                GROUP BY car_id) groupedsd
                ON sd.car_id = groupedsd.car_id 
                AND sd.time_2_end = groupedsd.MaxDateTime
                group by time_2_end::date
                order by time_2_end asc
            ), all_dates as (
                with dates as (
                    select generate_series(date '""" + first_date.strftime(
            "%Y-%m-%d") + """' , date '""" + last_date.strftime("%Y-%m-%d") + """', interval '1 day')::date as gen_date
                )
                select *
                from dates
                )
            select all_dates.gen_date, coalesce(car_count, 0) as number_of_cars
            from all_dates 
            left join car_result on all_dates.gen_date = car_result.time_2_end 
            order by all_dates.gen_date asc
        """)
        no_booked_airbnb_in_region_query = db.session.execute("""
                with all_dates as (
                with dates as (
                    select generate_series(date '""" + first_date.strftime(
            "%Y-%m-%d") + """' , date '""" + last_date.strftime("%Y-%m-%d") + """', interval '1 day')::date as gen_date
                )
                select *
                from dates
            ), airbnb_date as 
                (select ac."date", count(ac.id) as number_of_airbnbs
                from airbnb_calendar ac, airbnb_location al
                where ac."date" >= '""" + first_date.strftime("%Y-%m-%d") + """'
                and ac."date"::date <= '""" + last_date.strftime("%Y-%m-%d") + """'
                and ac.airbnb_id = al.airbnb_id
                and ac.availability = false
                group by ac."date"
                order by ac."date" asc)
            select all_dates.gen_date, coalesce(airbnb_date.number_of_airbnbs, 0) as booked_airbnbs
            from all_dates
            left join airbnb_date on all_dates.gen_date = airbnb_date."date"
            order by all_dates.gen_date asc
        """)
    number_cars_in_region = [list(e) for e in no_cars_in_region_query]
    number_booked_airbnb_in_region = [list(e) for e in no_booked_airbnb_in_region_query]

    if len(number_cars_in_region) == 0:
        abort(404, description="No data available for given timespan")
    if len(number_cars_in_region) != len(number_booked_airbnb_in_region):
        abort(404, "Please choose a different timespan and contact the administrator")

    result = {
        "airbnb": {
            "xaxis": [],
            "yaxis": []
        },
        "sharenow": {
            "xaxis": [],
            "yaxis": []
        }
    }
    if len(number_cars_in_region[0]) == 2:
        for i in range(0, len(number_cars_in_region)):
            result["sharenow"]["xaxis"].append(str(number_cars_in_region[i][0].strftime("%Y-%m-%d")))
            result["sharenow"]["yaxis"].append(number_cars_in_region[i][1])
            result["airbnb"]["xaxis"].append(str(number_booked_airbnb_in_region[i][0].strftime("%Y-%m-%d")))
            result["airbnb"]["yaxis"].append(number_booked_airbnb_in_region[i][1])
    elif len(number_cars_in_region[0]) == 3 and 'time_only' in request.args:
        for i in range(0, len(number_cars_in_region)):
            result["sharenow"]["xaxis"].append(
                str(datetime.datetime.combine(number_cars_in_region[i][0],
                                              datetime.time(number_cars_in_region[i][1], 0)).strftime(
                    "%H:%M")))
            result["sharenow"]["yaxis"].append(number_cars_in_region[i][2])
            result["airbnb"]["xaxis"].append(str(datetime.datetime.combine(number_booked_airbnb_in_region[i][0],
                                                                           datetime.time(
                                                                               number_booked_airbnb_in_region[i][1],
                                                                               0)).strftime("%H:%M")))
            result["airbnb"]["yaxis"].append(number_booked_airbnb_in_region[i][2])

    elif len(number_cars_in_region[0]) == 3:
        for i in range(0, len(number_cars_in_region)):
            result["sharenow"]["xaxis"].append(
                str(datetime.datetime.combine(number_cars_in_region[i][0],
                                              datetime.time(number_cars_in_region[i][1], 0)).strftime(
                    "%Y-%m-%d %H:%M")))
            result["sharenow"]["yaxis"].append(number_cars_in_region[i][2])
            result["airbnb"]["xaxis"].append(str(datetime.datetime.combine(number_booked_airbnb_in_region[i][0],
                                                                           datetime.time(
                                                                               number_booked_airbnb_in_region[i][1],
                                                                               0)).strftime("%Y-%m-%d %H:%M")))
            result["airbnb"]["yaxis"].append(number_booked_airbnb_in_region[i][2])

    else:
        abort(404, "Please choose a different timespan and contact the administrator")

    rs = jsonify(result)
    return rs


@app.route('/airbnb_sharenow_availability', methods=['GET'])
def getairbnbsharenowpercentualavailability():
    date_param = request.args['date']

    try:
        date = datetime.datetime.strptime(date_param, "%Y-%m-%d")
    except:
        return "Check date format. %Y-%m-%d is required"

    if 'region' in request.args and 'hour' in request.args:
        region_param = request.args['region']
        time_param = request.args['hour']
        try:
            time = datetime.datetime.strptime(time_param, '%H').time()
        except:
            return "Check time format. %H is required"

        region = Region.query.filter_by(region_name=region_param).scalar()
        results = RegionCarPerDay.query.filter(RegionCarPerDay.date == date).filter(
            RegionCarPerDay.region_id == region.id).filter(RegionCarPerDay.time == time).all()
    elif 'hour' in request.args:
        time_param = request.args['hour']
        try:
            time = datetime.datetime.strptime(time_param, '%H').time()
        except:
            return "Check time format. %H is required"
        results = RegionCarPerDay.query.filter(RegionCarPerDay.date == date).filter(RegionCarPerDay.time == time).all()

    elif 'region' in request.args:
        region_param = request.args['region']
        region = Region.query.filter_by(region_name=region_param).scalar()
        results = RegionCarPerDay.query.filter(RegionCarPerDay.date == date).filter(
            RegionCarPerDay.region_id == region.id).all()
    else:
        results = RegionCarPerDay.query.filter(RegionCarPerDay.date == date).all()

    sum_no_of_rides = 0
    sum_avg_availability = 0
    sum_no_of_booked_airbnbs = 0
    sum_no_of_existing_airbnbs = 0
    if len(results) == 0:
        abort(404, description="No data available for given timespan")
    for e in results:
        sum_no_of_rides += e.number_of_rides
        sum_avg_availability += (e.number_of_rides * e.car_avg_availability)
        sum_no_of_booked_airbnbs += e.number_of_booked_airbnbs
        sum_no_of_existing_airbnbs += e.number_of_existing_airbnbs
    rs = jsonify({'booked_airbnb_percentage': float(dynamicPriceFactors.divide(sum_avg_availability, sum_no_of_rides)),
                  'booked_sharenow_percentage': float(
                      dynamicPriceFactors.divide(sum_no_of_booked_airbnbs, sum_no_of_existing_airbnbs))})
    return rs


@app.route('/sharenow', methods=['GET'])
def getsharenowdata():
    date_param = request.args['date']
    try:
        date = datetime.datetime.strptime(date_param, "%Y-%m-%d")
    except:
        return "Check date format. %Y-%m-%d is required"

    if 'hour' not in request.args:
        results = SampleData.query.filter(func.extract('year', SampleData.time_2_end) == date.year).filter(
            func.extract('month', SampleData.time_2_end) == date.month).filter(
            func.extract('day', SampleData.time_2_end) == date.day).all()
    else:
        time_param = request.args['hour']
        try:
            time = datetime.datetime.strptime(time_param, '%H').time()
        except:
            return "Check time format. %H is required"
        results = SampleData.query.filter(func.extract('year', SampleData.time_2_end) == date.year).filter(
            func.extract('month', SampleData.time_2_end) == date.month).filter(
            func.extract('day', SampleData.time_2_end) == date.day).filter(
            func.extract('hour', SampleData.time_2_end) == time.hour).all()
    rs = jsonify({'sharenow_data': [r.serialize_location_only() for r in results]})
    return rs


@app.route('/single-column-matrix', methods=['GET'])
def get_single_column_matrix():
    region_param = request.args['region']
    region = Region.query.filter_by(region_name=region_param).scalar()
    return jsonify({
        "region": region.serialize_switched_coords(),
        "matrix": dynamicPriceFactors.get_single_column_matrix(region),
    })


@app.route('/region_availability', methods=['GET'])
def get_region_availability():
    no_of_months_param = int(request.args['months'])
    last_month = RegionCar.query.order_by(RegionCar.date.desc()).first().date
    tmp_month = last_month
    tmp = {}

    if 'region' not in request.args:
        tmp["months"] = []
        tmp["Munich"] = {}
        tmp["Munich"]["cars"] = []
        tmp["Munich"]["avg_availability"] = []

        for e in range(0, no_of_months_param):
            tmp_result = RegionCar.query.filter_by(date=tmp_month).all()
            tmp["months"].append(get_Month(tmp_month.month))
            cars = 0
            avg_cars = 0
            for i in tmp_result:
                cars += i.number_of_cars
                avg_cars += i.avg_availability * i.number_of_cars
            tmp["Munich"]["cars"].append(cars)
            tmp["Munich"]["avg_availability"].append(
                str(round((dynamicPriceFactors.divide(avg_cars, cars)) * 100)) + "%")
            tmp_month = tmp_month - dateutil.relativedelta.relativedelta(months=1)
        return jsonify({
            "series": [{"name": "Munich",
                        "data": tmp["Munich"]["avg_availability"]}],
            "xaxis": tmp["months"]
        })

    else:
        region_param = request.args['region']
        region = Region.query.filter_by(region_name=region_param).scalar()
        max_region = Region.query.order_by(Region.region_number.desc()).first()
        if region.id > 1:
            region_before = Region.query.filter_by(region_number=region.region_number - 1).scalar()
        else:
            region_before = Region.query.filter_by(region_number=region.region_number + 2).scalar()

        if region.region_number < max_region.region_number - 1:
            region_after = Region.query.filter_by(region_number=region.region_number + 1).scalar()

        else:
            region_after = Region.query.filter_by(region_number=region.region_number - 2).scalar()

        region_list = [region, region_before, region_after]

        region_list_id = [e.id for e in region_list]
        for e in region_list_id:
            tmp["months"] = []
            tmp[e] = {}
            tmp[e]["cars"] = []
            tmp[e]["avg_availability"] = []
        for e in range(0, no_of_months_param):
            tmp_result = RegionCar.query.filter_by(date=tmp_month, region_id=region.region_number).all()
            tmp_result.extend(RegionCar.query.filter_by(date=tmp_month, region_id=region_before.region_number).all())
            tmp_result.extend(RegionCar.query.filter_by(date=tmp_month, region_id=region_after.region_number).all())
            tmp["months"].append(get_Month(tmp_month.month))
            for i in tmp_result:
                tmp[i.region_id]["cars"].append(i.number_of_cars)
                tmp[i.region_id]["avg_availability"].append(str(round(i.avg_availability * 100)) + "%")

            tmp_month = tmp_month - dateutil.relativedelta.relativedelta(months=1)

        return jsonify({
            "series": [{"name": Region.query.filter_by(id=e).scalar().region_name,
                        "data": tmp[e]["avg_availability"]} for e in
                       region_list_id],
            "xaxis": tmp["months"]
        })


@app.route('/region_car_detailed', methods=['GET'])
def get_region_car_detailed():
    date_param = request.args['date']

    try:
        date = datetime.datetime.strptime(date_param, "%Y-%m-%d")
    except:
        return "Check date format. %Y-%m-%d is required"

    if 'hour' not in request.args:
        results = RegionCarPerDay.query.filter(RegionCarPerDay.date == date).all()

    else:

        time_param = request.args['hour']
        try:
            time = datetime.datetime.strptime(time_param, '%H').time()
        except:
            return "Check time format. %H is required"

        results = RegionCarPerDay.query.filter(RegionCarPerDay.date == date).filter(RegionCarPerDay.time == time).all()
    rs = jsonify({'region_car_detailed_data': [r.serialize() for r in results]})
    return rs

@app.route('/car_flow', methods=['GET'])
def car_flow():
    start_id = request.args['start']
    destination_id = request.args['destination']
    date_param = request.args['date']
    return str(dynamicPriceFactors.get_number_of_rides(start_id, destination_id, date_param))

@app.route('/matrix_tree', methods=['GET'])
def get_matrix_tree():
    region_param = request.args['region']
    date_param = request.args['date']

    try:
        date = datetime.datetime.strptime(date_param, "%Y-%m-%d").date()
    except:
        return "Check date format. %Y-%m-%d is required"

    region = Region.query.filter_by(region_name=region_param).scalar()

    if 'hour' not in request.args:
        results = RegionCarMovement.query.filter(RegionCarMovement.date == date).filter(
            RegionCarMovement.start_region_id == region.id).distinct().all()

    else:
        time_param = request.args['hour']
        try:
            time = datetime.datetime.strptime(time_param, '%H').time()
        except:
            return "Check time format. %H is required"

        results = RegionCarMovement.query.filter(RegionCarMovement.date == date).filter(
            RegionCarMovement.start_region_id == region.id).filter(
            RegionCarMovement.time == time).distinct().all()
    r_tmp = Region.query.all()
    regions = {}
    for ele in r_tmp:
        regions[ele.id] = ele.region_name
    no_cars = 0
    tmp = {}
    tmp["no_cars"] = 0
    tmp["series"] = {}
    for ele in results:
        tmp["no_cars"] += ele.number_of_rides
        if ele.stop_region_id not in tmp["series"]:
            tmp["series"][ele.stop_region_id] = 0
        tmp["series"][ele.stop_region_id] += ele.number_of_rides

    series = []
    for ele in tmp['series']:
        tmp_s = {}
        tmp_s["data"] = [tmp["series"][ele]]
        tmp_s["name"] = regions[ele]
        series.append(tmp_s)
    tmp["series"] = series
    tmp["no_cars"] = str(tmp["no_cars"])
    return jsonify(tmp)


@app.route('/region_car_movement', methods=['GET'])
def get_region_car_movement():
    date_param = request.args['date']

    try:
        date = datetime.datetime.strptime(date_param, "%Y-%m-%d")
    except:
        return "Check date format. %Y-%m-%d is required"

    if 'hour' not in request.args:
        results = RegionCarMovement.query.filter(RegionCarMovement.date == date).all()

    else:
        time_param = request.args['hour']
        try:
            time = datetime.datetime.strptime(time_param, '%H').time()
        except:
            return "Check time format. %H is required"

        results = RegionCarMovement.query.filter(RegionCarMovement.date == date).filter(
            RegionCarMovement.time == time).all()
    rs = jsonify({'region_car_movement_data': [r.serialize() for r in results]})
    return rs


@app.route('/region_summary', methods=['GET'])
def get_region_summary():
    # region_param = request.args['region']
    no_of_months_param = int(request.args['months'])

    # region = Region.query.filter_by(region_name=region_param).scalar()
    region_list = Region.query.order_by(Region.region_number).distinct().all()
    last_month = RegionCar.query.order_by(RegionCar.date.desc()).first().date

    tmp = {}
    region_list_id = [e.id for e in region_list]
    for e in region_list_id:
        tmp["months"] = []
        tmp[e] = {}
        tmp[e]["cars"] = []
        tmp[e]["airbnbs"] = []
        tmp[e]["avg_availability"] = []
    tmp_month = last_month
    for e in range(0, no_of_months_param):
        tmp_result = RegionCar.query.filter_by(date=tmp_month).all()
        tmp["months"].append(get_Month(tmp_month.month))
        for i in tmp_result:
            tmp[i.region_id]["cars"].append(i.number_of_cars)
            tmp[i.region_id]["airbnbs"].append(i.number_of_airbnbs)
            tmp[i.region_id]["avg_availability"].append(i.avg_availability)

        tmp_month = tmp_month - dateutil.relativedelta.relativedelta(months=1)

    return jsonify({
        "series": [{"name": Region.query.filter_by(id=e).scalar().region_name, "cars": tmp[e]["cars"],
                    "airbnbs": tmp[e]["airbnbs"], "avg_availability": tmp[e]["avg_availability"]} for e in
                   region_list_id],
        "xaxis": tmp["months"]
    })


def get_colour_by_availability(availability):
    hue = int((availability * 120))
    tmp = [round(i * 255) for i in colorsys.hsv_to_rgb(hue / 360, 1, 0.5)]
    return tmp


@app.route('/regions', methods=['GET'])
def get_regions():
    if 'date' in request.args and 'time':
        date_param = request.args['date']
        time_param = request.args['time']

        try:
            date = datetime.datetime.strptime(date_param, "%Y-%m-%d")
            time = datetime.datetime.strptime(time_param, '%H').time()

        except:
            return "Check date format. %Y-%m-%d is required.\nCheck time format. %H is required"

        result = RegionCarPerDay.query.filter(RegionCarPerDay.date == date).filter(
            RegionCarPerDay.time == time).order_by(RegionCarPerDay.region_id.asc()).all()

        region_availability_dict = {}
        for e in result:
            region_availability_dict[e.region_id] = round((1 - e.car_avg_availability), 2)

        region_result = Region.query.order_by(Region.region_number.asc()).all()
        for e in region_result:
            try:
                tmp = get_colour_by_availability(region_availability_dict[e.id])
                e.color = tmp
            except KeyError:
                e.color = [255, 255, 255]

        list = [r.serialize_switched_coords() for r in region_result]
        return jsonify({
            "type": "FeatureCollection",
            "features": list
        })
    else:
        result = Region.query.order_by(Region.region_number.asc()).all()

        list = [r.serialize_switched_coords() for r in result]
        return jsonify({
            "type": "FeatureCollection",
            "features": list
        })


if __name__ == '__main__':
    app.run()

from flask import Flask
from models.rest_models import SampleData, RegionCar, Region, AirbnbLocation, RegionObj, AirbnbLocationObj, db, \
    ShareNow, AirbnbCalendar, RegionCarPerDay, RegionCarMovement
from flask_cors import CORS
from utils.load_data.munich_regions_raw_data import get_regions
from utils.load_data.generate_sample_car_data import get_car_data, get_car_data_random
from shapely.geometry.point import Point
from datetime import datetime, date
import csv
import datetime
from psycopg2 import OperationalError
from sqlalchemy.exc import OperationalError as oe
import time
from logging.config import fileConfig

flask_app = Flask(__name__)


def create_app():
    # flask_app.config.from_object('config.DevelopmentConfig')
    flask_app.config.from_object('config.Docker')
    fileConfig('logging.conf')
    flask_app.app_context().push()
    db.init_app(flask_app)
    flask_app.logger.info("App is starting ...")

    retry = 0
    while retry < 5:
        try:
            # db.drop_all()
            db.create_all()
            break
        except OperationalError:
            flask_app.logger.warn("DB unavailable. Try again in 3 seconds")
            time.sleep(3)
            retry += 1
        except oe:
            flask_app.logger.warn("DB unavailable. Try again in 3 seconds")
            time.sleep(3)
            retry += 1

    #cors = CORS(flask_app)

    no_region = db.session.execute("SELECT count(distinct id) FROM region;").scalar()
    flask_app.logger.info(str(no_region) + " Region entries")
    if no_region == 0:
        insert_region_data()

    no_airbnb_location = db.session.execute("SELECT count(distinct id) FROM airbnb_location;").scalar()
    flask_app.logger.info(str(no_airbnb_location) + " Airbnb location entries")
    if no_airbnb_location == 0:
        add_airbnb_data()

    no_share_now = db.session.execute("SELECT count(distinct id) FROM share_now;").scalar()
    flask_app.logger.info(str(no_share_now) + " ShareNow entries")
    if no_share_now == 0:
        add_sharenow_dummy_data()

    no_sample_data = db.session.execute("SELECT count(distinct id) FROM sample_data;").scalar()
    flask_app.logger.info(str(no_sample_data) + " Sample data entries")
    if no_sample_data == 0:
        add_sample_data()

    no_airbnb_calender = db.session.execute("SELECT count(distinct id) FROM airbnb_calendar;").scalar()
    flask_app.logger.info(str(no_airbnb_calender) + " Airbnb calender entries")
    if no_airbnb_calender == 0:
        add_airbnb_calendar_data()
        # add_airbnb_calendar_data2()

    no_region_car = db.session.execute("SELECT count(distinct id) FROM region_car;").scalar()
    flask_app.logger.info(str(no_region_car) + " RegionCar entries")
    if no_region_car == 0:
        recalculate_region_car_db()

    no_region_car_per_day = db.session.execute("SELECT count(distinct id) FROM region_car_per_day;").scalar()
    flask_app.logger.info(str(no_region_car_per_day) + " Region car per day " + " & " + str(
        db.session.execute(
            "SELECT count(distinct id) FROM region_car_movement;").scalar()) + " Region car movement entries")
    if no_region_car_per_day == 0:
        add_region_car_per_day()

    # db.session.close()
    return flask_app


def insert_region_data():
    flask_app.logger.info("Insert region data")
    rlist = get_regions()
    for r in rlist:
        db.session.add(r)
    db.session.commit()
    flask_app.logger.info("Region import completed | " + str(
        db.session.execute("SELECT count(distinct id) FROM region;").scalar()) + " entries added\n")


def add_airbnb_data():
    flask_app.logger.info("Insert airbnb data")

    with open('data/listings.csv', 'r', encoding="utf8") as f:
        reader = csv.reader(f)
        your_list = list(reader)

    list_tmp = your_list[1::]
    results = []
    for i in list_tmp:
        point = Point(float(i[6]), float(i[7]))
        try:
            last_review = datetime.strptime(i[12], '%Y-%m-%d')
        except:
            last_review = None
        query_str = """select distinct r.id from region r where point '(""" + str(point.x) + """,""" + str(
            point.y) + """)' <@ cast(r.coordinates as polygon)"""
        region_id = db.session.execute(query_str).scalar()
        a = AirbnbLocation(i[0], region_id, i[1], i[2], i[3], i[4], i[5], point, i[8], i[9], i[10], i[11], last_review,
                           none_if_empty(i[13]), i[14], i[15])
        results.append(a)
        db.session.add(a)
    db.session.commit()
    flask_app.logger.info("Airbnb import completed  | " + str(
        db.session.execute("SELECT count(distinct id) FROM airbnb_location;").scalar()) + " entries added\n")


def add_sharenow_dummy_data():
    flask_app.logger.info("Insert ShareNow dummy data")
    with open('data/ShareNow_Dummy_Data_utf8.csv', 'r', encoding="utf_8") as f:
        reader = csv.reader(f)
        your_list = list(reader)

    list_tmp = your_list[1::]
    for i in list_tmp:
        time_tmp = i[6] + " " + i[7]
        point = Point(float(i[9]), float(i[8]))
        s = ShareNow(i[0], i[1], int(i[2]), float(i[3].replace("km", "")), float(i[4]), float(i[5].replace("€", "")),
                     datetime.datetime.strptime(time_tmp, "%d.%m.%Y %H.%M"), point, float(i[10].replace("%", "")) / 100)
        db.session.add(s)
    db.session.commit()
    flask_app.logger.info("ShareNow dummy data import completed | " + str(
        db.session.execute("SELECT count(distinct id) FROM share_now;").scalar()) + " entries added\n")


def add_sample_data():
    flask_app.logger.info("Insert Car data")
    tmp_list = get_car_data()
    tmp_list1 = get_car_data_random(0.9, 1)
    tmp_list2 = get_car_data_random(0.8, 2)
    for e in tmp_list:
        db.session.add(e)
    db.session.commit()
    for e in tmp_list1:
        db.session.add(e)
    db.session.commit()
    for e in tmp_list2:
        db.session.add(e)
    db.session.commit()
    flask_app.logger.info("Car data import completed | " + str(db.session.execute(
        "SELECT count(distinct id) FROM sample_data;").scalar()) + " entries added\n")


def recalculate_region_car_db():
    flask_app.logger.info("Insert Region_Car data")
    region_list = Region.query.all()
    region_list = list(map(lambda x: RegionObj(x), region_list))

    airbnb_locations = AirbnbLocation.query.all()
    airbnb_locations = list(map(lambda z: AirbnbLocationObj(z), airbnb_locations))

    s = SampleData.query.all()
    date_list = [datetime.date(row[0], row[1], 1) for row in db.session.execute(
        "SELECT distinct (EXTRACT (Year from time_2_end))::INTEGER as Year, (Extract (Month from time_2_end))::INTEGER as Month FROM onelocation.sample_data;")]
    # date = datetime.datetime.strptime("01-" + str(month) + "-" + str(year), "%d-%m-%Y")
    tmp = {}
    for i in region_list:
        tmp[i.id] = {}
        for x in date_list:
            tmp[i.id][str(x)] = {}
            tmp[i.id][str(x)]["cars"] = 0
            tmp[i.id]["airbnbs"] = 0
            tmp[i.id][str(x)]["availability"] = 0

    for ele in s:
        tmp[ele.district_2][str(ele.time_2_end.date().replace(day=1))]["cars"] += 1
        tmp[ele.district_2][str(ele.time_2_end.date().replace(day=1))]["availability"] += int(ele.available)

    for e in region_list:
        tmp[e.id]["airbnbs"] = db.session.execute(
            """SELECT count(distinct airbnb_id) FROM airbnb_location where region_id = """ + str(
                e.id) + """;""").scalar()

    for i in region_list:
        for x in date_list:
            rc = RegionCar(i.id, x, tmp[i.id][str(x)]["cars"], tmp[i.id]["airbnbs"],
                           tmp[i.id][str(x)]["availability"] / tmp[i.id][str(x)]["cars"])
            db.session.add(rc)
    db.session.commit()
    flask_app.logger.info("Region_Car import completed | " + str(
        db.session.execute("SELECT count(distinct id) FROM region_car;").scalar()) + " entries added\n")


def add_airbnb_calendar_data():
    flask_app.logger.info("Insert AirBnB Calendar data. This may take a very long time ...")

    with open('data/calendar_2.csv', 'r', encoding="utf_8") as f:
        reader = csv.reader(f)
        your_list = list(reader)

    list_tmp = your_list[1::]
    for n, i in enumerate(list_tmp):

        try:
            date_ele = datetime.date.fromisoformat(i[1])
        except Exception as inst:
            print("Fehler : " + i[1])
            print("i: " + i)
            print(inst)
            date_ele = None
        avail = True if i[2] == "t" else False

        if len(i[3]) > 0:
            price = float(i[3].replace("$", "").replace(",", ""))
        else:
            price = 0.0

        if len(i[4]) > 0:
            adj_price = float(i[4].replace("$", "").replace(",", ""))
        else:
            adj_price = 0.0

        tmp = AirbnbCalendar(i[0], date_ele, avail, price, adj_price, i[5], i[6])
        db.session.add(tmp)
        if (n % 100) == 0:
            db.session.commit()
        if (n % 100000) == 0:
            flask_app.logger.info(str(n) + " airbnb_calendar_data entries committed")
    db.session.commit()

    flask_app.logger.info("AirBnB Calendar import completed | " + str(
        db.session.execute("SELECT count(distinct id) FROM airbnb_calendar;").scalar()) + " entries added\n")


def add_airbnb_calendar_data2():
    flask_app.logger.info("Insert AirBnB Calendar data.  This may take a very long time ...")

    with open('data/calendar_1.csv', 'r', encoding="utf_8") as f:
        reader = csv.reader(f)
        your_list = list(reader)

    list_tmp = your_list[1::]
    for n, i in enumerate(list_tmp):

        try:
            date_ele = datetime.date.fromisoformat(i[1])
        except Exception as inst:
            print("Fehler : " + i[1])
            print("i: " + i)
            print(inst)
            date_ele = None
        avail = True if i[2] == "t" else False

        if len(i[3]) > 0:
            price = float(i[3].replace("$", "").replace(",", ""))
        else:
            price = 0.0

        if len(i[4]) > 0:
            adj_price = float(i[4].replace("$", "").replace(",", ""))
        else:
            adj_price = 0.0

        tmp = AirbnbCalendar(i[0], date_ele, avail, price, adj_price, i[5], i[6])
        db.session.add(tmp)
        if (n % 100) == 0:
            db.session.commit()
        if (n % 100000) == 0:
            flask_app.logger.info(str(n) + " airbnb_calendar_data2 entries committed")
    db.session.commit()

    flask_app.logger.info("AirBnB Calendar import completed | " + str(
        db.session.execute("SELECT count(distinct id) FROM airbnb_calendar;").scalar()) + " entries added\n")


def add_region_car_per_day():
    flask_app.logger.info("Insert RegionCarPerDay data. This may take a very long time ...")
    result = {}
    result_region_car_movement = {}

    data = SampleData.query.all()

    for i in data:

        # Region car movement
        if i.district_1 not in result_region_car_movement:
            result_region_car_movement[i.district_1] = {}

        if i.district_2 not in result_region_car_movement[i.district_1]:
            result_region_car_movement[i.district_1][i.district_2] = {}

        if i.time_2_end.date() not in result_region_car_movement[i.district_1][i.district_2]:
            result_region_car_movement[i.district_1][i.district_2][i.time_2_end.date()] = {}

        if i.time_2_end.hour not in result_region_car_movement[i.district_1][i.district_2][i.time_2_end.date()]:
            result_region_car_movement[i.district_1][i.district_2][i.time_2_end.date()][i.time_2_end.hour] = {}

        if "number_of_rides" not in result_region_car_movement[i.district_1][i.district_2][i.time_2_end.date()][
            i.time_2_end.hour]:
            result_region_car_movement[i.district_1][i.district_2][i.time_2_end.date()][i.time_2_end.hour][
                "number_of_rides"] = 0

        if "total_driven_minutes" not in result_region_car_movement[i.district_1][i.district_2][i.time_2_end.date()][
            i.time_2_end.hour]:
            result_region_car_movement[i.district_1][i.district_2][i.time_2_end.date()][i.time_2_end.hour][
                "total_driven_time"] = datetime.timedelta()

        result_region_car_movement[i.district_1][i.district_2][i.time_2_end.date()][i.time_2_end.hour][
            "number_of_rides"] += 1
        result_region_car_movement[i.district_1][i.district_2][i.time_2_end.date()][i.time_2_end.hour][
            "total_driven_time"] += i.time_2_end - i.time_1_start

        # Region car per day
        if i.district_2 not in result:
            result[i.district_2] = {}
        if i.time_2_end.date() not in result[i.district_2]:
            result[i.district_2][i.time_2_end.date()] = {}
        if i.time_2_end.hour not in result[i.district_2][i.time_2_end.date()]:
            result[i.district_2][i.time_2_end.date()][i.time_2_end.hour] = {}

        if "number_of_rides" not in result[i.district_2][i.time_2_end.date()][i.time_2_end.hour]:
            result[i.district_2][i.time_2_end.date()][i.time_2_end.hour]["number_of_rides"] = 0
        if "total_driven_minutes" not in result[i.district_2][i.time_2_end.date()][i.time_2_end.hour]:
            result[i.district_2][i.time_2_end.date()][i.time_2_end.hour]["total_driven_time"] = datetime.timedelta()
        if "car_avg_availability" not in result[i.district_2][i.time_2_end.date()][i.time_2_end.hour]:
            result[i.district_2][i.time_2_end.date()][i.time_2_end.hour]["car_avg_availability"] = 0

        result[i.district_2][i.time_2_end.date()][i.time_2_end.hour]["number_of_rides"] += 1

        if i.available:
            result[i.district_2][i.time_2_end.date()][i.time_2_end.hour]["car_avg_availability"] += 1

        result[i.district_2][i.time_2_end.date()][i.time_2_end.hour][
            "total_driven_time"] += i.time_2_end - i.time_1_start
        result[i.district_2][i.time_2_end.date()][i.time_2_end.hour]["number_of_booked_airbnbs"] = db.session.execute("""
            select count(distinct ac.airbnb_id)
            from airbnb_location al, airbnb_calendar ac
            where al.region_id = """ + str(i.district_2) + """
            and al.airbnb_id = ac.airbnb_id
            and ac."date" = '""" + str(i.time_2_end.date()) + """'
            and ac.availability = false""").scalar()
        result[i.district_2][i.time_2_end.date()][i.time_2_end.hour]["number_of_existing_airbnbs"] = db.session.execute("""
            select count(distinct ac.airbnb_id)
            from airbnb_location al, airbnb_calendar ac
            where al.region_id = """ + str(i.district_2) + """
            and al.airbnb_id = ac.airbnb_id
            and ac."date" = '""" + str(i.time_2_end.date()) + """'""").scalar()

    flask_app.logger.info("Region car per day / region car movement data calculated. Inserting data to database ...")

    index_tmp = 0
    for district in result:
        for day in result[district]:
            for hour in result[district][day]:
                tmp = RegionCarPerDay(district, day, datetime.time(hour),
                                      result[district][day][hour]["number_of_rides"],
                                      result[district][day][hour]["total_driven_time"],
                                      result[district][day][hour]["car_avg_availability"] / result[district][day][hour][
                                          "number_of_rides"],
                                      result[district][day][hour]["number_of_booked_airbnbs"],
                                      result[district][day][hour]["number_of_existing_airbnbs"])
                # print("total driven time: " + str(tmp.total_driven_time))
                index_tmp += 1
                db.session.add(tmp)
                if (index_tmp % 100) == 0:
                    db.session.commit()
            # print(str(index_tmp) + " Elements added")
    db.session.commit()

    index_tmp = 0
    for dis1 in result_region_car_movement:
        for dis2 in result_region_car_movement[dis1]:
            for day in result_region_car_movement[dis1][dis2]:
                for hour in result_region_car_movement[dis1][dis2][day]:
                    tmp = RegionCarMovement(dis1, dis2, day, datetime.time(hour),
                                            result_region_car_movement[dis1][dis2][day][hour]["number_of_rides"],
                                            result_region_car_movement[dis1][dis2][day][hour]["total_driven_time"])
                    db.session.add(tmp)
                    index_tmp += 1
                    if (index_tmp % 100) == 0:
                        db.session.commit()
    db.session.commit()
    flask_app.logger.info("RegionCarPerDay import completed | " + str(
        db.session.execute("SELECT count(distinct id) FROM region_car_per_day;").scalar()) + " & " + str(
        db.session.execute("SELECT count(distinct id) FROM region_car_movement;").scalar()) + " entries added\n")


def none_if_empty(tmp):
    if tmp == '':
        return None
    return tmp

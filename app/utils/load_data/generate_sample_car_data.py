import pandas as pd
import datetime as dt
import random

from shapely.geometry import LineString, Point
from geoalchemy2.shape import to_shape
from models.rest_models import SampleData, db, Region
import dateutil

from random import randint


def random_point_within(poly):
    min_x, min_y, max_x, max_y = poly.bounds

    index = 0
    while index < 1000:
        random_point = Point([random.uniform(min_x, max_x), random.uniform(min_y, max_y)])
        index += 1
        if (random_point.within(poly)):
            return random_point
    print("Critical Error: Unable to generate random point")


def get_region_polygons():
    region_query = Region.query.all()
    regions = {}
    for r in region_query:
        regions[r.id] = to_shape(r.coordinates)
    return regions


def get_car_data_random(rand, delta_month):
    regions = get_region_polygons()
    number_of_cars = 3000

    # arrays which consists of district name, number of inhabitants and counter = number of cars in this area
    munich_districts = [
        ["Ramersdorf - Perlach", int(108 * rand), 0],
        ["Neuhausen-Nymphenburg", 95 * rand, 0],
        ["Thalkirchen-Obersendling-Forstenried-Fürstenried-Solln", 90 * rand, 0],
        ["Bogenhausen", 82 * rand, 0],
        ["Milbertshofen-Am Hart", 73 * rand, 0],
        ["Pasing-Obermenzing", 70 * rand, 0],
        ["Schwabing-Freimann", 69 * rand, 0],
        ["Trudering-Riem", 67 * rand, 0],
        ["Schwabing-West", 65 * rand, 0],
        ["Au-Haidhausen", 59 * rand, 0],
        ["Feldmoching-Hasenbergl", 59 * rand, 0],
        ["Sendling-Westpark", 55 * rand, 0],
        ["Laim", 54 * rand, 0],
        ["Untergiesing-Harlaching", 51 * rand, 0],
        ["Maxvorstadt", 51 * rand, 0],
        ["Moosach", 51 * rand, 0],
        ["Obergiesing-Fasangarten", 51 * rand, 0],
        ["Ludwigsvorstadt-Isarvorstadt", 50 * rand, 0],
        ["Hadern", 48 * rand, 0],
        ["Berg am Laim", 43 * rand, 0],
        ["Aubing-Lochhausen-Langwied", 42 * rand, 0],
        ["Sendling", 39 * rand, 0],
        ["Allach-Untermenzing", 30 * rand, 0],
        ["Schwanthalerhöhe", 29 * rand, 0],
        ["Altstadt-Lehel", 20 * rand, 0],
    ]

    min_inhabitants = 30  # = 30.000
    max_inhabitants = 108  # = 108.000

    df = pd.DataFrame(munich_districts, columns=[
        'district', 'inhabitants', 'vehicles'
    ])

    min = df['inhabitants'].min()
    max = df['inhabitants'].max()
    sum = df['inhabitants'].sum()

    # determine percentual share of cars according to the number of inhabitants

    # calc percentual share
    perc_share = []
    car_share = []

    for index, row in df.iterrows():
        inhabitants = row['inhabitants']
        perc = inhabitants / sum
        perc_share.append(perc)
        car_share.append(round(perc * number_of_cars))

    df['percentual_share'] = perc_share
    df['vehicles'] = car_share

    # iterate all districts and all vehicles within a district

    districts = len(df) - 1

    df_row = []
    counter = 0
    for index, row in df.iterrows():
        start_district = row['district']
        vehicles = int(row['vehicles'])
        for x in range(vehicles):
            r_number = randint(0, districts)
            end_district = df.iloc[r_number]['district']
            counter = counter + 1

            # time logic
            available = random.choice([True, False])
            today = dt.datetime.today()
            today = today - dt.timedelta(days=randint(0, 4), hours=randint(0, 3), minutes=randint(0, 59))

            if not available:
                today = today - dt.timedelta(minutes=randint(5, 30))

            b2 = today
            b1 = b2 - dt.timedelta(minutes=randint(10, 600))
            c2 = b1
            c1 = c2 - dt.timedelta(minutes=randint(5, 30))
            a2 = c1
            a1 = a2 - dt.timedelta(minutes=randint(10, 600))

            time_1 = [a1, a2]
            time_2 = [b1, b2]
            travel_1_2 = [c1, c2]

            # combine all columns
            df_row.append([
                counter,
                start_district,
                end_district,
                time_1,
                time_2,
                travel_1_2,
                available
            ])

    # create data frame
    df_rand = pd.DataFrame(df_row, columns=[
        'carID', 'district_1', 'district_2', 'time_1', 'time_2', 'travel_1_2', 'is_available'
    ])

    tmp_list = []

    for i in df_row:
        car_id = i[0]

        dis_1 = i[1]
        dis_2 = i[2]
        time_1_start = i[3][0]
        time_1_end = i[3][1]

        time_2_start = i[4][0]
        time_2_end = i[4][1]

        travel_1_2_start = i[5][0]
        travel_1_2_end = i[5][1]

        available = i[6]

        tmp = SampleData(car_id, dis_1, dis_2, time_1_start - dateutil.relativedelta.relativedelta(months=delta_month),
                         time_1_end - dateutil.relativedelta.relativedelta(months=delta_month),
                         time_2_start - dateutil.relativedelta.relativedelta(months=delta_month),
                         time_2_end - dateutil.relativedelta.relativedelta(months=delta_month),
                         travel_1_2_start - dateutil.relativedelta.relativedelta(months=delta_month),
                         travel_1_2_end - dateutil.relativedelta.relativedelta(months=delta_month), available,
                         random_point_within(regions[Region.query.filter_by(region_name=dis_2).scalar().id]))

        tmp_list.append(tmp)
    return tmp_list


def get_car_data():
    regions = get_region_polygons()
    number_of_cars = 3000

    # arrays which consists of district name, number of inhabitants and counter = number of cars in this area
    munich_districts = [
        ["Ramersdorf - Perlach", 108, 0],
        ["Neuhausen-Nymphenburg", 95, 0],
        ["Thalkirchen-Obersendling-Forstenried-Fürstenried-Solln", 90, 0],
        ["Bogenhausen", 82, 0],
        ["Milbertshofen-Am Hart", 73, 0],
        ["Pasing-Obermenzing", 70, 0],
        ["Schwabing-Freimann", 69, 0],
        ["Trudering-Riem", 67, 0],
        ["Schwabing-West", 65, 0],
        ["Au-Haidhausen", 59, 0],
        ["Feldmoching-Hasenbergl", 59, 0],
        ["Sendling-Westpark", 55, 0],
        ["Laim", 54, 0],
        ["Untergiesing-Harlaching", 51, 0],
        ["Maxvorstadt", 51, 0],
        ["Moosach", 51, 0],
        ["Obergiesing-Fasangarten", 51, 0],
        ["Ludwigsvorstadt-Isarvorstadt", 50, 0],
        ["Hadern", 48, 0],
        ["Berg am Laim", 43, 0],
        ["Aubing-Lochhausen-Langwied", 42, 0],
        ["Sendling", 39, 0],
        ["Allach-Untermenzing", 30, 0],
        ["Schwanthalerhöhe", 29, 0],
        ["Altstadt-Lehel", 20, 0],
    ]

    min_inhabitants = 30  # = 30.000
    max_inhabitants = 108  # = 108.000

    df = pd.DataFrame(munich_districts, columns=[
        'district', 'inhabitants', 'vehicles'
    ])

    min = df['inhabitants'].min()
    max = df['inhabitants'].max()
    sum = df['inhabitants'].sum()

    # determine percentual share of cars according to the number of inhabitants

    # calc percentual share
    perc_share = []
    car_share = []

    for index, row in df.iterrows():
        inhabitants = row['inhabitants']
        perc = inhabitants / sum
        perc_share.append(perc)
        car_share.append(round(perc * number_of_cars))

    df['percentual_share'] = perc_share
    df['vehicles'] = car_share

    # iterate all districts and all vehicles within a district

    districts = len(df) - 1

    df_row = []
    counter = 0
    for index, row in df.iterrows():
        start_district = row['district']
        vehicles = int(row['vehicles'])
        for x in range(vehicles):
            r_number = randint(0, districts)
            end_district = df.iloc[r_number]['district']
            counter = counter + 1

            # time logic
            available = random.choice([True, False])
            today = dt.datetime.today()
            today = today - dt.timedelta(days=randint(0, 4), hours=randint(0, 3), minutes=randint(0, 59))

            if not available:
                today = today - dt.timedelta(minutes=randint(5, 30))

            b2 = today
            b1 = b2 - dt.timedelta(minutes=randint(10, 600))
            c2 = b1
            c1 = c2 - dt.timedelta(minutes=randint(5, 30))
            a2 = c1
            a1 = a2 - dt.timedelta(minutes=randint(10, 600))

            time_1 = [a1, a2]
            time_2 = [b1, b2]
            travel_1_2 = [c1, c2]

            # combine all columns
            df_row.append([
                counter,
                start_district,
                end_district,
                time_1,
                time_2,
                travel_1_2,
                available
            ])

    # create data frame
    df_rand = pd.DataFrame(df_row, columns=[
        'carID', 'district_1', 'district_2', 'time_1', 'time_2', 'travel_1_2', 'is_available'
    ])

    tmp_list = []

    for i in df_row:
        car_id = i[0]

        dis_1 = i[1]
        dis_2 = i[2]
        time_1_start = i[3][0]
        time_1_end = i[3][1]

        time_2_start = i[4][0]
        time_2_end = i[4][1]

        travel_1_2_start = i[5][0]
        travel_1_2_end = i[5][1]

        available = i[6]
        # print("car_id: " + str(car_id))
        # print("dis_1: " + dis_1)
        # print("dis_2: " + dis_2)
        # print("time_1_start: " + str(time_1_start))
        # print("time_1_end: " + str(time_1_end))
        # print("time_2_start: " + str(time_2_start))
        # print("time_2_end: " + str(time_2_end))
        # print("travel_1_2_start: " + str(travel_1_2_start))
        # print("travel_1_2_end: " + str(travel_1_2_end))
        # print("available: " + str(available))

        tmp = SampleData(car_id, dis_1, dis_2, time_1_start, time_1_end, time_2_start, time_2_end, travel_1_2_start,
                         travel_1_2_end, available,
                         random_point_within(regions[Region.query.filter_by(region_name=dis_2).scalar().id]))
        tmp1 = SampleData(car_id, dis_1, dis_2, time_1_start - dateutil.relativedelta.relativedelta(months=1),
                          time_1_end - dateutil.relativedelta.relativedelta(months=1),
                          time_2_start - dateutil.relativedelta.relativedelta(months=1),
                          time_2_end - dateutil.relativedelta.relativedelta(months=1),
                          travel_1_2_start - dateutil.relativedelta.relativedelta(months=1),
                          travel_1_2_end - dateutil.relativedelta.relativedelta(months=1), available,
                          random_point_within(regions[Region.query.filter_by(region_name=dis_2).scalar().id]))

        tmp2 = SampleData(car_id, dis_1, dis_2, time_1_start - dateutil.relativedelta.relativedelta(months=2),
                          time_1_end - dateutil.relativedelta.relativedelta(months=2),
                          time_2_start - dateutil.relativedelta.relativedelta(months=2),
                          time_2_end - dateutil.relativedelta.relativedelta(months=2),
                          travel_1_2_start - dateutil.relativedelta.relativedelta(months=2),
                          travel_1_2_end - dateutil.relativedelta.relativedelta(months=2), available,
                          random_point_within(regions[Region.query.filter_by(region_name=dis_2).scalar().id]))

        tmp_list.append(tmp)
    return tmp_list

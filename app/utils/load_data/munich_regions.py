import json
import matplotlib.pyplot as plt
from shapely.geometry.polygon import Polygon
import random
from math import sin, cos, sqrt, atan2, radians
from models.rest_models import *
from solve_tsp import main as main_solve_tsp

import psycopg2

result = []


def load_data():
    with open('../../data/Munich_regions.json', encoding="utf8") as json_file:
        data = json.load(json_file)
        regions = []
        for i in data['elements']:
            if i['type'] == "relation":
                tmp = {}
                tmp["region_name"] = i["tags"]["name"]
                tmp["ref"] = [x for x in i["members"] if x["role"] == "outer"]
                tmp["nodes"] = []
                tmp["points"] = []
                result.append(tmp)
                regions.append(i)
        for a in result:
            # while len(a["ref"]) > 0:
            for ref in a["ref"]:
                # ref = a["ref"].pop()
                for ele in data['elements']:
                    if ele['id'] == ref["ref"]:
                        a["nodes"].extend(ele["nodes"])
                        break
            for node in a["nodes"]:
                for ele in data['elements']:
                    if ele['id'] == node:
                        # a["points"].append({'lat': ele["lat"], 'lon': ele["lon"]})
                        a["points"].append((ele["lat"], ele["lon"]))
                        break

    for ele in result:
        # tmp = Polygon(ele['points'])
        # tmp = tmp.simplify(0.001)
        # ele['points_raw'] = ele['points']
        ele["points"] = main_solve_tsp(ele["points"])
        # ele['points'] = list(mapping(tmp)["coordinates"][0])

    for ele in result:
        # tmp_raw = Polygon(ele["points_raw"])
        tmp = Polygon(ele["points"])

        plt.fill(*tmp.exterior.xy, 'g')
        plt.title(ele["region_name"])
        plt.show()
        # plt.plot(*tmp_raw.exterior.xy, '--ro')
        # plt.title(ele["region_name"])
        # plt.show()
        plt.plot(*tmp.exterior.xy, '--bo')
        plt.title(ele["region_name"])
        plt.show()





def synToDatabase():
    try:
        for i in result:
            region_name = i["region_name"].replace("Stadtbezirk ", "")
            region_number = int(region_name[:2])
            region_name = region_name[3:]
            color = [random.randint(100, 256), random.randint(100, 256), random.randint(100, 256)]
            poly = Polygon(i["points"])
            r = Region(region_name, region_number, poly, color)
            db.session.add(r)
        db.session.commit()

    except (Exception, psycopg2.Error) as error:
        print("Error while connecting to PostgreSQL", error)
    finally:
        # closing database connection.
        if db.session:
            db.session.close()
            # db.session.connection().close()
            print("PostgreSQL connection is closed")


def import_regions():
    load_data()
    synToDatabase()


# def calc_dif(list):
#    length = len(list) - 1
#    for i in range(0, length):
#        lon1, lat1 = list[i]
#        lon2, lat2 = list[i + 1]
#        if calc_lat_long(lon1, lat1, lon2, lat2) > 0.5:
#            print(str(calc_lat_long(lon1, lat1, lon2, lat2)) + ": ", lon1, lat1, lon2, lat2, i, sep=", ")
#
#
# def calc_lat_long(long1, lati1, long2, lati2):
#    lon1 = radians(long1)
#    lon2 = radians(long2)
#    lat1 = radians(lati1)
#    lat2 = radians(lati2)
#    R = 6373.0
#    dlon = lon2 - lon1
#    dlat = lat2 - lat1
#    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
#    c = 2 * atan2(sqrt(a), sqrt(1 - a))
#
#    distance = R * c
#    return distance
#

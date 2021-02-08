from flask import Flask
import requests
import os
import datetime
from dotenv import load_dotenv
from models.rest_models import *
import mvg_api
import scipy
from scipy import optimize

flask_app = Flask(__name__)

load_dotenv()

def divide(x,y):
    try:
        return round(x/y,2)
    except ZeroDivisionError:
        return 0

def get_fair_weather(date, temp, precipitation, bft):
    return not ((date.month in (12, 1, 2) and temp < -2) #Winter
                or (date.month in (3, 4, 5) and temp < 5) #Spring
                or (date.month in (6, 7, 8) and temp < 15) #Summer
                or (date.month in (9, 10, 11) and temp < 5) #Autumn
                or precipitation > 0.5
                or bft > 3)

def derive():
    max_x = scipy.optimize.fmin(lambda x: -(4 * x**2 - x**3), 0)
    return str(max_x)

# source: https://www.ruhr-uni-bochum.de/verkehrswesen/download/literatur/RUBIT_HE_01_12_11Cit.pdf
def utility_function(time, cost):
    return 0.006466 - 3.83 * float(time) - 4.37 * float(cost)

def modal_choice_probability(utility, all_utilities, probability_sum):
    return probability_sum/sum(map(lambda x: (utility/x) ** 4, all_utilities))

# bicycle speed is set to 20km/h (and walking to 5km/h)
def get_modal_split(car_cost, mvv_cost, car_duration, mvv_duration, bike_duration, fair_weather=True):
    car_utility = utility_function(car_duration, car_cost)
    mvv_utility = utility_function(mvv_duration, mvv_cost)
    bike_utility = utility_function(bike_duration, 0)
    all = [car_utility, mvv_utility, bike_utility]
    if fair_weather:
        # Max: price * share of population (multiplying with the population isn't necessary, doesn't affect the optimum)
        max = scipy.optimize.fmin(lambda x: -x * (modal_choice_probability(utility_function(car_duration, x),
                                                                           [utility_function(car_duration, x),
                                                                            mvv_utility, bike_utility], 1)), 0)
        optimal_car_utility = utility_function(car_duration, max)
        optimal_all = [optimal_car_utility, mvv_utility, bike_utility]
        return {
            'car': round(modal_choice_probability(car_utility, all, 1), 2),
            'mvv': round(modal_choice_probability(mvv_utility, all, 1), 2),
            'bike': round(modal_choice_probability(bike_utility, all, 1), 2),
            'optimal_car': round(modal_choice_probability(optimal_car_utility, optimal_all, 1), 2),
            'optimal_mvv': round(modal_choice_probability(mvv_utility, optimal_all, 1), 2),
            'optimal_bike': round(modal_choice_probability(bike_utility, optimal_all, 1), 2),
            'optimal_price': round(max[0], 2)
        }
    else:
        # in case of bad weather, the amount of people walking or cycling roughly halves
        bike_probability = modal_choice_probability(bike_utility, all, 1)/2
        max = scipy.optimize.fmin(lambda x: -x * (modal_choice_probability(utility_function(car_duration, x),
                                                                           [utility_function(car_duration, x),
                                                                            mvv_utility, bike_utility],
                                                                           (1-(modal_choice_probability(bike_utility, [utility_function(car_duration, x),
                                                                            mvv_utility, bike_utility], 1)/2)))), 0)
        optimal_car_utility = utility_function(car_duration, max)
        optimal_all = [optimal_car_utility, mvv_utility]
        optimal_bike_probability = modal_choice_probability(bike_utility, [optimal_car_utility, mvv_utility, bike_utility], 1)/2
        return {
            'car': round(modal_choice_probability(car_utility, [car_utility, mvv_utility], (1-bike_probability)), 2),
            'mvv': round(modal_choice_probability(mvv_utility, [car_utility, mvv_utility], (1-bike_probability)), 2),
            'bike': round(bike_probability, 2),
            'optimal_car': round(modal_choice_probability(optimal_car_utility, optimal_all, (1-optimal_bike_probability)), 2),
            'optimal_mvv': round(modal_choice_probability(mvv_utility, optimal_all, (1-optimal_bike_probability)), 2),
            'optimal_bike': round(optimal_bike_probability, 2),
            'optimal_price': round(max[0], 2)
        }

def get_weather(region, timedate):
    apikey = os.getenv("DARKSKY_API_KEY")
    date = timedate.strftime('%Y-%m-%dT%H:%M:%S')
    try:
        r = requests.get(f'https://api.darksky.net/forecast/{apikey}/{region.x},{region.y},{date}?exclude=minutely,hourly,daily,flags&units=si')
        req = r.json()['currently']
        return {"condition": req['summary'], "temp": req['temperature'], "wind": beaufort_scale(req['windSpeed']), "precipitation": req['precipIntensity'], "fair-weather": get_fair_weather(timedate, req['temperature'], req['precipIntensity'], beaufort_scale(req['windSpeed'])['bft'])}
    except:
        return None

# 9 is already dangerous, 10 or higher should trigger a warning, to deny people car access (high risk of an accident)
def beaufort_scale(windspeed):
    if windspeed < 0.5:
        return {"speed": windspeed, "description": "Calm", "bft": 0}
    elif windspeed < 1.5:
        return {"speed": windspeed, "description": "Light air", "bft": 1}
    elif windspeed < 3.3:
        return {"speed": windspeed, "description": "Light breeze", "bft": 2}
    elif windspeed < 5.5:
        return {"speed": windspeed, "description": "Gentle breeze", "bft": 3}
    elif windspeed < 7.9:
        return {"speed": windspeed, "description": "Moderate breeze", "bft": 4}
    elif windspeed < 10.7:
        return {"speed": windspeed, "description": "Fresh breeze", "bft": 5}
    elif windspeed < 13.8:
        return {"speed": windspeed, "description": "Strong breeze", "bft": 6}
    elif windspeed < 17.1:
        return {"speed": windspeed, "description": "Moderate gale", "bft": 7}
    elif windspeed < 20.7:
        return {"speed": windspeed, "description": "Gale", "bft": 8}
    elif windspeed < 24.4:
        return {"speed": windspeed, "description": "Strong gale", "bft": 9}
    elif windspeed < 28.4:
        return {"speed": windspeed, "description": "Storm", "bft": 10}
    elif windspeed < 32.6:
        return {"speed": windspeed, "description": "Violent storm", "bft": 11}
    else:
        return {"speed": windspeed, "description": "Hurricane", "bft": 12}

#availability & provision
def get_availability_by_date(region_id, date_param):
    original_date = datetime.datetime.strptime(date_param, '%Y-%m-%dT%H:%M:%S.%fZ')
    # get the closest date
    smaller_date = RegionCarPerDay.query.filter(RegionCarPerDay.region_id == region_id,
                                                RegionCarPerDay.date <= original_date.date()).order_by(
        RegionCarPerDay.date.desc()).first()
    greater_date = RegionCarPerDay.query.filter(RegionCarPerDay.region_id == region_id,
                                                RegionCarPerDay.date >= original_date.date()).order_by(
        RegionCarPerDay.date.asc()).first()
    if smaller_date is None:
        closest_date = greater_date.date
    elif greater_date is None:
        closest_date = smaller_date.date
    else:
        if (original_date.date() - smaller_date.date) <= (greater_date.date - original_date.date()):
            closest_date = smaller_date.date
        else:
            closest_date = greater_date.date
    # get the closest time
    smaller_time = RegionCarPerDay.query.filter(RegionCarPerDay.region_id == region_id,
                                                RegionCarPerDay.date == closest_date,
                                                RegionCarPerDay.time <= original_date.time()).order_by(
        RegionCarPerDay.time.desc()).first()
    greater_time = RegionCarPerDay.query.filter(RegionCarPerDay.region_id == region_id,
                                                RegionCarPerDay.date == closest_date,
                                                RegionCarPerDay.time >= original_date.time()).order_by(
        RegionCarPerDay.time.asc()).first()
    if smaller_time is None:
        return RegionCarPerDay.serialize(greater_time)
    elif greater_time is None:
        return RegionCarPerDay.serialize(smaller_time)
    else:
        if (datetime.datetime.combine(closest_date, original_date.time()) - datetime.datetime.combine(closest_date,
                                                                                                      smaller_time.time)) <= (
                datetime.datetime.combine(closest_date, greater_time.time) - datetime.datetime.combine(closest_date,
                                                                                                       original_date.time())):
            return RegionCarPerDay.serialize(smaller_time)
        else:
            return RegionCarPerDay.serialize(greater_time)

def get_provision(start, destination, start_availability, destination_availability):
    diff = get_avg_price(destination) * (1-destination_availability) - get_avg_price(start) * (1-start_availability)
    return round(diff, 2)

def get_optimum(start_id, destination_id, start_region, destination_region, start_availability, destination_availability, date):
    # provision being the benefit of having the car in the destination, rather than the starting region
    provision = get_provision(start_region, destination_region, start_availability, destination_availability)
    rides = get_number_of_rides(start_id, destination_id, date)

def get_avg_price(region):
    sum = 0
    durations = get_single_column_matrix(region)['durations'][0]
    for e in durations:
        sum += round(sharenow_price(e / 60))
    avg = divide(sum, len(durations))
    return avg

def get_number_of_rides(start_id, destination_id, date_param):
    original_date = datetime.datetime.strptime(date_param, '%Y-%m-%dT%H:%M:%S.%fZ')
    smaller_date = RegionCarMovement.query.filter(RegionCarMovement.start_region_id == start_id,
                                                  RegionCarMovement.stop_region_id == destination_id,
                                                  RegionCarMovement.date <= original_date.date()).order_by(
        RegionCarMovement.date.desc()).first()
    greater_date = RegionCarMovement.query.filter(RegionCarMovement.start_region_id == start_id,
                                                  RegionCarMovement.stop_region_id == destination_id,
                                                  RegionCarMovement.date >= original_date.date()).order_by(
        RegionCarMovement.date.asc()).first()
    if smaller_date is None:
        closest_date = greater_date.date
    elif greater_date is None:
        closest_date = smaller_date.date
    else:
        if (original_date.date() - smaller_date.date) <= (greater_date.date - original_date.date()):
            closest_date = smaller_date.date
        else:
            closest_date = greater_date.date
    # get the closest time
    smaller_time = RegionCarMovement.query.filter(RegionCarMovement.start_region_id == start_id,
                                                  RegionCarMovement.stop_region_id == destination_id,
                                                  RegionCarMovement.date == closest_date,
                                                  RegionCarMovement.time <= original_date.time()).order_by(
        RegionCarMovement.time.desc()).first()
    greater_time = RegionCarMovement.query.filter(RegionCarMovement.start_region_id == start_id,
                                                  RegionCarMovement.stop_region_id == destination_id,
                                                  RegionCarMovement.date == closest_date,
                                                  RegionCarMovement.time >= original_date.time()).order_by(
        RegionCarMovement.time.asc()).first()
    if smaller_time is None:
        return greater_time.number_of_rides
    elif greater_time is None:
        return smaller_time.number_of_rides
    else:
        if (datetime.datetime.combine(closest_date, original_date.time()) - datetime.datetime.combine(closest_date,
                                                                                                      smaller_time.time)) <= (
                datetime.datetime.combine(closest_date, greater_time.time) - datetime.datetime.combine(closest_date,
                                                                                                       original_date.time())):
            return smaller_time.number_of_rides
        else:
            return greater_time.number_of_rides

# basic prices
def sharenow_price(duration):
    return round(1 + duration * 0.36, 2)

def taxi_price(length):
    if length <= 5:
        return 3.7 + 2 * length
    elif length <= 10:
        return 13.7 + 1.8 * (length - 5)
    else:
        return 22.7 + 1.7 * (length - 10)

# distance, duration and traffic conditions
def single_route_distance(start, destination, traffic):
    r_distance = get_distance(start, destination, traffic)
    res = {
        "sharenow": r_distance['sharenow'],
        "distance": r_distance['distance'],
        "duration": r_distance['duration'],
        "taxi": r_distance['taxi']
    }
    if traffic:
        res.update({
            "congestion": get_congestion(start, destination)
        })
    return res

# how long does it take to get from a to b using a bicycle
def get_cycling_duration(start, destination):
    apikey = os.getenv("MAPBOX_API_KEY")
    r = requests.get(f'https://api.mapbox.com/directions/v5/mapbox/cycling'
                     f'/{start.y},{start.x};{destination.y},{destination.x}?geometries=geojson&access_token={apikey}')
    req = r.json()
    # duration is returned in seconds. Convert it to minutes.
    r_duration = req['routes'][0]['legs'][0]['duration'] / 60
    return r_duration

def get_distance(start, destination, traffic):
    apikey = os.getenv("MAPBOX_API_KEY")
    if traffic:
        r = requests.get(f'https://api.mapbox.com/directions/v5/mapbox/driving-traffic'
                         f'/{start.y},{start.x};{destination.y},{destination.x}?geometries=geojson&access_token={apikey}')
    else:
        r = requests.get(f'https://api.mapbox.com/directions/v5/mapbox/driving'
                         f'/{start.y},{start.x};{destination.y},{destination.x}?geometries=geojson&access_token={apikey}')
    req = r.json()
    r_distance = round(req['routes'][0]['legs'][0]['distance'] / 1000, 2)
    r_duration = req['routes'][0]['legs'][0]['duration'] / 60
    # duration is returned in seconds, distance in meters. Convert it to minutes and kilometers
    return {
        "duration": round(r_duration),
        "distance": r_distance,
        "taxi": round(taxi_price(r_distance), 2),
        "sharenow": round(sharenow_price(r_duration), 2)
    }

def get_congestion(start, destination):
    apikey = os.getenv("MAPBOX_API_KEY")
    traffic = requests.get(f'https://api.mapbox.com/directions/v5/mapbox/driving-traffic'
                     f'/{start.y},{start.x};{destination.y},{destination.x}?geometries=geojson&overview=full'
                           f'&annotations=congestion&access_token={apikey}')
    req = traffic.json()
    traffic2 = requests.get(f'https://api.mapbox.com/directions/v5/mapbox/driving-traffic'
                           f'/{start.y},{start.x};{destination.y},{destination.x}?geometries=geojson&overview=full'
                            f'&annotations=distance&access_token={apikey}')
    req2 = traffic2.json()
    congestion_list = req['routes'][0]['legs'][0]['annotation']['congestion']
    distance_list = req2['routes'][0]['legs'][0]['annotation']['distance']
    i = 0
    unknown, unknown_distance, low, low_distance, moderate, moderate_distance, heavy, heavy_distance, severe, severe_distance, distance_sum = (0,)*11
    while i < len(congestion_list):
        if congestion_list[i] == "low":
            low += 1
            low_distance += distance_list[i]
        elif congestion_list[i] == "moderate":
            moderate += 1
            moderate_distance += distance_list[i]
        elif congestion_list[i] == "heavy":
            heavy += 1
            heavy_distance += distance_list[i]
        elif congestion_list[i] == "severe":
            severe += 1
            severe_distance += distance_list[i]
        else:
            unknown += 1
            unknown_distance += distance_list[i]
        distance_sum += distance_list[i]
        i += 1
    return {'unknown': divide(unknown_distance, distance_sum), 'low': divide(low_distance, distance_sum),
            'moderate': divide(moderate_distance, distance_sum), 'heavy': divide(heavy_distance, distance_sum),
            'severe': divide(severe_distance, distance_sum)}

#mvv
# returns trip duration in minutes, mvg api only provides data for 30 days prior and 5 months into the future
def get_mvv_duration(start, destination, date):
    td = 0
    try:
        route = mvg_api.get_route((start.x, start.y), (destination.x, destination.y), time=date)
        if (len(route) >= 1):
            arrival = route[0]['arrival_datetime']
            departure = route[0]['departure_datetime']
            td = divide((arrival - departure).seconds, 60)
        return {"price": 3.3, "duration": td}
    except:
        return None

# matrices
def get_single_column_matrix(region):
    start_polygon = to_shape(region.coordinates)
    start_center = start_polygon.centroid
    region_str = str(start_center.y)+','+str(start_center.x)+';'
    regions = Region.query.order_by(Region.region_name).distinct().all()
    for r in regions:
        if r != region:
            r_center = to_shape(r.coordinates).centroid
            region_str += str(r_center.y)+','+str(r_center.x)+';'
    region_str = region_str[:-1]
    apikey = os.getenv("MAPBOX_API_KEY")
    # difference between driving and driving-traffic is estimate vs current traffic data, driving-traffic doesn't allow more than 10 coordinates :(
    request = requests.get(f'https://api.mapbox.com/directions-matrix/v1/mapbox/driving/{region_str}?sources=0&destinations=all&annotations=distance,duration&access_token={apikey}')
    # request = requests.get(f'https://api.mapbox.com/directions-matrix/v1/mapbox/driving-traffic/{region_str}?annotations=distance,duration&access_token={apikey}')
    req = request.json()
    # distances = req['distances']
    return req

def get_distance_matrix(centers):
    # flask_app.logger.info(start)
    region_str = ""
    for r in centers:
        region_str += str(r.y)+','+str(r.x)+';'
    region_str = region_str[:-1]
    apikey = os.getenv("MAPBOX_API_KEY")
    request = requests.get(f'https://api.mapbox.com/directions-matrix/v1/mapbox/driving/{region_str}?annotations'
                           f'=distance,duration&access_token={apikey}')
    req = request.json()
    distances = req['durations']
    distances = [[sharenow_price(divide(x, 60)) for x in row] for row in distances]
    # duration is returned in seconds, distance in meters. Convert it to minutes and kilometers
    return distances

# traffic annotations: https://docs.mapbox.com/api/navigation/#route-leg-object

# https://docs.mapbox.com/api/navigation/
# mapbox directions, https://docs.mapbox.com/help/tutorials/getting-started-directions-api/
# https://api.mapbox.com/directions/v5/mapbox/cycling/-84.518641,39.134270;-84.512023,39.102779?geometries=geojson&access_token=pk.eyJ1IjoibWF1eG9zIiwiYSI6ImNrMml3Y3MxOTBreDQzbG9rYWw2OW1mMDQifQ.w2jYMj_NL3O2NIgQpLsevA

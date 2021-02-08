import geopandas
import json
from flask_sqlalchemy import SQLAlchemy
from geoalchemy2 import Geometry
from geoalchemy2.shape import from_shape, to_shape
from shapely.geometry.polygon import Polygon
from geoalchemy2.elements import WKBElement
from shapely.geometry.point import Point
from flask import Flask

db = SQLAlchemy()
db.metadata.schema = 'onelocation'


########
# app = Flask(__name__)
# app.config.from_object('config.Docker')
#
# db = SQLAlchemy(app)
# db.metadata.schema = 'onelocation'
###############

class AirbnbLocationObj:
    def __init__(self, airbnb_location):
        self.id = airbnb_location.id
        self.airbnb_id = airbnb_location.airbnb_id
        self.name = airbnb_location.name
        self.host_id = airbnb_location.host_id
        self.host_name = airbnb_location.host_name
        self.neighbourhood_group = airbnb_location.neighbourhood_group
        self.neighbourhood = airbnb_location.neighbourhood
        self.location = to_shape(airbnb_location.location)
        self.room_type = airbnb_location.room_type
        self.price = airbnb_location.price
        self.minimum_nights = airbnb_location.minimum_nights
        self.number_of_reviews = airbnb_location.number_of_reviews
        self.last_review = airbnb_location.last_review
        self.reviews_per_month = airbnb_location.reviews_per_month
        self.calculated_host_listings_count = airbnb_location.calculated_host_listings_count
        self.availability_365 = airbnb_location.availability_365


class AirbnbCalendar(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    airbnb_id = db.Column(db.Integer, db.ForeignKey('airbnb_location.airbnb_id'))
    date = db.Column(db.Date)
    availability = db.Column(db.Boolean)
    price = db.Column(db.Float)
    adjusted_price = db.Column(db.Float)
    minimum_nights = db.Column(db.Integer)
    maximum_nights = db.Column(db.Integer)

    def __init__(self, airbnb_id, date, availability, price, adjusted_price, minimum_nights, maximum_nights):
        self.airbnb_id = airbnb_id
        self.date = date
        self.availability = availability
        self.price = price
        self.adjusted_price = adjusted_price
        self.minimum_nights = minimum_nights
        self.maximum_nights = maximum_nights

    def serialize(self):
        return {
            'car_vin': self.car_vin,
            'type_of_car': self.type_of_car,
            'seats': self.seats,
            'avg_distance_of_rides': self.avg_distance_of_rides,
            'avg_number_of_customers_per_day': self.avg_number_of_customers_per_day,
            'avg_price_per_minute': self.avg_price_per_minute,
            'date': self.date.strftime("Y-%m-%d"),
            'tank_filling': self.tank_filling
        }


# This class is a lightweight way in order to return all latitudes and longitues of an AirbnbCalendar object
class AirbnbCalendarObj():
    def __init__(self, airbnb_id, location):
        # self.airbnb_id = airbnb_id
        self.location = WKBElement(location)

    def serialize(self):
        location = to_shape(self.location)
        return {
            # 'airbnb_id': self.airbnb_id,
            'latitude': location.x,
            'longitude': location.y
        }


class AirbnbLocation(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    airbnb_id = db.Column(db.Integer, unique=True)
    region_id = db.Column(db.Integer, db.ForeignKey('region.id'))
    name = db.Column(db.String)
    host_id = db.Column(db.Integer)
    host_name = db.Column(db.String)
    neighbourhood_group = db.Column(db.String)
    neighbourhood = db.Column(db.String)
    location = db.Column(Geometry('POINT'))
    room_type = db.Column(db.String)
    price = db.Column(db.Float)
    minimum_nights = db.Column(db.Integer)
    number_of_reviews = db.Column(db.Integer)
    last_review = db.Column(db.Date)
    reviews_per_month = db.Column(db.Float)
    calculated_host_listings_count = db.Column(db.Integer)
    availability_365 = db.Column(db.Integer)

    def __init__(self, airbnb_id, region_id, name, host_id, host_name, neighbourhood_group, neighbourhood, location,
                 room_type, price, minimum_nights, number_of_reviews, last_review, reviews_per_month,
                 calculated_host_listings_count, availability_365):
        self.airbnb_id = airbnb_id
        self.region_id = region_id
        self.name = name
        self.host_id = host_id
        self.host_name = host_name
        self.neighbourhood_group = neighbourhood_group
        self.neighbourhood = neighbourhood
        self.location = from_shape(location)
        self.room_type = room_type
        self.price = price
        self.minimum_nights = minimum_nights
        self.number_of_reviews = number_of_reviews
        self.last_review = last_review
        self.reviews_per_month = reviews_per_month
        self.calculated_host_listings_count = calculated_host_listings_count
        self.availability_365 = availability_365

    def serialize(self):
        location = to_shape(self.location)
        return {
            'id': self.id,
            'name': self.name,
            'host_id': self.host_id,
            'host_name': self.host_name,
            'neighbourhood_group': self.neighbourhood_group,
            'neighbourhood': self.neighbourhood,
            'latitude': location.x,
            'longitude': location.y,
            'room_type': self.room_type,
            'price': self.price,
            'minimum_nights': self.minimum_nights
        }


class SampleData(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    car_id = db.Column(db.Integer)
    district_1 = db.Column(db.Integer, db.ForeignKey('region.id'))
    district_2 = db.Column(db.Integer, db.ForeignKey('region.id'))
    time_1_start = db.Column(db.DateTime)
    time_1_end = db.Column(db.DateTime)
    time_2_start = db.Column(db.DateTime)
    time_2_end = db.Column(db.DateTime)
    travel_1_2_start = db.Column(db.DateTime)
    travel_1_2_end = db.Column(db.DateTime)
    available = db.Column(db.Boolean)
    location = db.Column(Geometry('POINT'))

    def __init__(self, car_id, district_1, district_2, time_1_start, time_1_end, time_2_start, time_2_end,
                 travel_1_2_start, travel_1_2_end, available, location):
        try:
            dis_1 = Region.query.filter_by(region_name=district_1).scalar().id
            dis_2 = Region.query.filter_by(region_name=district_2).scalar().id
            self.car_id = car_id
            self.district_1 = dis_1
            self.district_2 = dis_2
            self.time_1_start = time_1_start
            self.time_1_end = time_1_end
            self.time_2_start = time_2_start
            self.time_2_end = time_2_end
            self.travel_1_2_start = travel_1_2_start
            self.travel_1_2_end = travel_1_2_end
            self.available = available
            self.location = from_shape(location)
        except:
            raise Exception("Couldn't create object")

    def serialize_location_only(self):
        location = to_shape(self.location)
        return {
            'latitude': location.x,
            'longitude': location.y
        }



class ShareNow(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    car_vin = db.Column(db.String)
    type_of_car = db.Column(db.String)
    seats = db.Column(db.Integer)
    avg_distance_of_rides = db.Column(db.Float)
    avg_number_of_customers_per_day = db.Column(db.Float)
    avg_price_per_minute = db.Column(db.Float)
    datetime = db.Column(db.DateTime)
    location = db.Column(Geometry('POINT'))
    tank_filling = db.Column(db.Float)

    def __init__(self, car_vin, type_of_car, seats, avg_distance_of_rides, avg_number_of_customers_per_day,
                 avg_price_per_minute, datetime, location, tank_filling):
        self.car_vin = car_vin
        self.type_of_car = type_of_car
        self.seats = seats
        self.avg_distance_of_rides = avg_distance_of_rides
        self.avg_number_of_customers_per_day = avg_number_of_customers_per_day
        self.avg_price_per_minute = avg_price_per_minute
        self.datetime = datetime
        self.location = from_shape(location)
        self.tank_filling = tank_filling

    def serialize(self):
        location = to_shape(self.location)
        return {
            'car_vin': self.car_vin,
            'type_of_car': self.type_of_car,
            'seats': self.seats,
            'avg_distance_of_rides': self.avg_distance_of_rides,
            'avg_number_of_customers_per_day': self.avg_number_of_customers_per_day,
            'avg_price_per_minute': self.avg_price_per_minute,
            'datetime': self.datetime.isoformat(),
            'latitude': location.x,
            'longitude': location.y,
            'tank_filling': self.tank_filling
        }


class RegionCar(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    region_id = db.Column(db.Integer, db.ForeignKey('region.id'))
    date = db.Column(db.Date)
    number_of_cars = db.Column(db.Integer)
    number_of_airbnbs = db.Column(db.Integer)
    avg_availability = db.Column(db.Float)

    def __init__(self, region_id, date, number_of_cars, number_of_airbnbs, avg_availability):
        self.region_id = region_id
        self.date = date
        self.number_of_cars = number_of_cars
        self.number_of_airbnbs = number_of_airbnbs
        self.avg_availability = avg_availability

    def serialize(self):
        return {
        'region_id': self.region_id,
        'date': self.date.isoformat(),
        'number_of_cars': self.number_of_cars,
        'number_of_airbnbs': self.number_of_airbnbs,
        'avg_availability': self.avg_availability
        }


# class RegionCarChain(db.Model):
#    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
#    start_region_id = db.Column(db.Integer, db.ForeignKey('region.id'))
#    stop_region_id = db.Column(db.Integer, db.ForeignKey('region.id'))
#    car_id
#    car_start_location
#    car_stop_location
#    car_start_datetime
#    car_stop_datetime
#    car_in_usage

class RegionCarPerDay(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    region_id = db.Column(db.Integer, db.ForeignKey('region.id'))
    date = db.Column(db.Date)
    time = db.Column(db.Time)
    number_of_rides = db.Column(db.Integer)
    total_driven_time = db.Column(db.Interval)
    car_avg_availability = db.Column(db.Float)
    number_of_booked_airbnbs = db.Column(db.Integer)
    number_of_existing_airbnbs = db.Column(db.Integer)

    def __init__(self, region_id, date, time, number_of_rides, total_driven_time, car_avg_availability,
                 number_of_booked_airbnbs,
                 number_of_existing_airbnbs):
        self.region_id = region_id
        self.date = date
        self.time = time
        self.number_of_rides = number_of_rides
        self.total_driven_time = total_driven_time
        self.car_avg_availability = car_avg_availability
        self.number_of_booked_airbnbs = number_of_booked_airbnbs
        self.number_of_existing_airbnbs = number_of_existing_airbnbs

    def serialize(self):
        return {
            'region_id': self.region_id,
            'date': self.date.strftime("%Y-%m-%d"),
            'time': self.time.strftime("%H:%M"),
            'number_of_rides': self.number_of_rides,
            'total_driven_time': self.total_driven_time.total_seconds(),
            'car_avg_availability': self.car_avg_availability,
            'number_of_booked_airbnbs': self.number_of_booked_airbnbs,
            'number_of_existing_airbnbs': self.number_of_existing_airbnbs
        }


class RegionCarMovement(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    start_region_id = db.Column(db.Integer, db.ForeignKey('region.id'))
    stop_region_id = db.Column(db.Integer, db.ForeignKey('region.id'))
    date = db.Column(db.Date)
    time = db.Column(db.Time)
    number_of_rides = db.Column(db.Integer)
    total_driven_time = db.Column(db.Interval)

    def __init__(self, start_region_id, stop_region_id, date, time, number_of_rides, total_driven_time):
        self.start_region_id = start_region_id
        self.stop_region_id = stop_region_id
        self.date = date
        self.time = time
        self.number_of_rides = number_of_rides
        self.total_driven_time = total_driven_time

    def serialize(self):
        return {
            'start_region_id': self.start_region_id,
            'stop_region_id': self.stop_region_id,
            'date': self.date.strftime("%Y-%m-%d"),
            'time': self.time.strftime("%H:%M"),
            'number_of_rides': self.number_of_rides,
            'total_driven_time': self.total_driven_time.total_seconds()
        }


class RegionObj:
    def __init__(self, db_region):
        self.id = db_region.id
        self.region_name = db_region.region_name
        self.region_number = db_region.region_number
        self.coordinates = to_shape(db_region.coordinates)
        self.color = db_region.color


class Region(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    region_name = db.Column(db.String(150))
    region_number = db.Column(db.Integer)
    coordinates = db.Column(Geometry('POLYGON'))
    color = db.Column(db.ARRAY(db.SmallInteger))

    def __init__(self, region_name, region_number, geo_coordinates, color):
        self.region_name = region_name
        self.region_number = region_number
        self.coordinates = from_shape(geo_coordinates)
        self.color = color

    def serialize_switched_coords(self):
        poly_coords = to_shape(self.coordinates).exterior.coords
        switched_poly = Polygon(list(map(lambda z: (z[1], z[0]), poly_coords)))
        data = json.loads(geopandas.GeoSeries(switched_poly).to_json())
        data.pop("bbox", None)
        data["features"][0].pop("bbox", None)
        data["features"][0]["color"] = self.color
        data["features"][0]["name"] = self.region_name
        data["features"][0]["properties"]["region_number"] = self.region_number

        return data["features"][0]

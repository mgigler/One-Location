# One Location
An interactive dashboard to visualize the correlation between the location of ShareNow cars and Airbnbs.

## Docker setup

### Install docker
- Under Windows add your drive to the shared drives (right click docker icon in toolbar -> Settings -> Shared Drives)
- Activate "Expose deamon" if you want to control docker via pycharm (right click docker icon in toolbar -> Settings -> General)

## Set up .env file
Create a .env file in your app directory (or a more secure place) and add

MAPBOX_API_KEY=yourmapboxkey

DARKSKY_API_KEY=yourdarkskykey

to it. If you store it somewhere else, you have to specify the path in load_dotenv(yourpath)
https://pypi.org/project/python-dotenv/

You can use .env.original as a template by simply duplicating and renaming it (to .env)

### Run
- Navigate to the OneLocation directory
- ```docker-compose build```
- ```docker-compose up``` or ```docker-compose up -d```(in order to run it in the background)

## Endpoints
- Rest API: http://localhost:5000
- PgAdmin: http://localhost:9202
    - Email Address: pguser
    - Password: pgpass
    - Add a new Server :
        - General -> Name: e.g. Onelocation db
        - Connection -> Host name/address: db
        - Connection -> Port: 5432
        - Connection -> Username: onelocation
        - Connection -> Password: EUt82sXUYhicJZMI8ZPs
- Portainer (to manage all containers): http://localhost:9201


## Update existing db schema

Before pulling the lastest version perform the following steps:
- Visit http://localhost:9201
    - Click on Containers on the left  (in case you don't see containers press the toggle button (the two arrows) on the upper left)
        - Check the checkbox of ```onelocation_rest-api_1``` and ```onelocation_db_1```
        - Once those two are selected press the ```Remove``` Button
    - Now click on Volumes on the left
        - Check the Checkbox next to onelocation_postgres-data in order to select it
        - Press the ```Remove``` Button
    - Congratulations you have successfully deleted the old instance!
- Pull the latest version from Git
    - Run ```docker-compose build```
    - Run ```docker-compose up``` or ```docker-compose up -d```
- Congratulations the latest version is running now!

## Routes

### Airbnb by date
`/airbnb_by_date?date=2020-10-09`

Returns all Airbnbs from a specific day, where the availabilty is false - which means they are in use

Example:
~~~
{
  "airbnb_listings": [
    {
      "latitude": 48.14413, 
      "longitude": 11.55802
    }, ...
  ]
 }
~~~


### ShareNow by date and hour 
`/sharenow?date=2020-01-12&hour=14`

Returns all ShareNow locations from a specific day and within a one hour window

For this request all share now locations from the 12.10.2020 from 14:00 - 14:59  will be returned

Optional parameters: 
- hour (if not set the whole day is selected)

Example:
~~~
{
  "sharenow_data": [
    {
      "latitude": 48.14413, 
      "longitude": 11.55802
    }, ...
  ]
 }
~~~

### Matrix Tree by date and region 

`/matrix_tree?region=Moosach&date=2020-01-14&hour=20`

Returns the number of cars that moved to a different region per datetime within a given region

Optional parameters: 
- hour (if not set the whole day is selected)

~~~
{
  "no_cars": "35",
  "series": [
    {
      "data": [
        2
      ],
      "name": "Berg am Laim"
    },
    {
      "data": [
        6
      ],
      "name": "Hadern"
    }, ...
    ]
}
~~~

### Availability Chart by region

`/region_availability?months=3&region=Moosach`

Returns the availability of cars per month within a given region in the last X months from the current month</ul>

Optional parameters: 
- region (if not set all regions are selected)

Example:
~~~
{
  "series": [
    {
      "data": [
        38, 
        47, 
        61
      ], 
      "name": "Moosach"
    }, 
    {
      "data": [
        36, 
        45, 
        47
      ], 
      "name": "Neuhausen-Nymphenburg"
    }, 
    {
      "data": [
        53, 
        44, 
        44
      ], 
      "name": "Milbertshofen-Am Hart"
    }
  ], 
  "xaxis": [
    "January", 
    "December", 
    "November"
  ]
}
~~~

### Region summary

`/region_summary?months=3`

Returns all number of existing Airbnbs, avg. availability of ShareNow cars and number of existing ShareNow cars in a region

Example:
~~~
{
  "series": [
    {
      "airbnbs": [
        404,
        404,
        404
      ],
      "avg_availability": [
        0.495726495726496,
        0.409090909090909,
        0.476923076923077
      ],
      "cars": [
        117,
        110,
        130
      ],
      "name": "Altstadt-Lehel"
    },
    ...
  ],
  "xaxis": [
    "January",
    "December",
    "November"
  ]
}
~~~

### Airbnb and ShareNow availability (in percent)

`/airbnb_sharenow_availability?date=2020-01-14&region=Moosach&hour=21`

Returns the percentage of booked airbnbs and the average availability of ShareNow cars. Depending by date, hour and region

Optional parameters: 
- region (if not set all regions are selected)
- hour (if not set the whole day is selected)

Example:
~~~
{
  "booked_airbnb_percentage": 0.7142857142857141,
  "booked_sharenow_percentage": 0.5401459854014599
}
~~~

### Airbnb and ShareNow numbers 

`/airbnb_sharenow_number?first_date=2020-01-14&last_date=2020-01-17&region=Moosach`

Returns the number of booked airbnbs and existing ShareNow cars. Depending by a date span, time span and region

Required parameters:
- first_date (e.g. 2020-01-14)
- last_date (2020-01-17)

Optional parameters: 
- region (if not set all regions are selected)
- first_hour (e.g. 9; if not set the whole day is selected)
- last_hour (e.g. 23; if not set the whole day is selected)
- time_only (just set the parameter, no value required. If enabled only the time without the date will be returned. E.g. `/airbnb_sharenow_number?first_date=2020-01-14&last_date=2020-01-17&time_only`)

Example:
~~~
{
  "airbnb": {
    "xaxis": [
      "2020-01-14",
      "2020-01-15",
      "2020-01-16",
      "2020-01-17"
    ],
    "yaxis": [
      74,
      74,
      75,
      75
    ]
  },
  "sharenow": {
    "xaxis": [
      "2020-01-14",
      "2020-01-15",
      "2020-01-16",
      "2020-01-17"
    ],
    "yaxis": [
      25,
      27,
      23,
      27
    ]
  }
}
~~~

### Region car detailed

`/region_car_detailed?date=2020-01-14&hour=20`

Returns the number of rides, avg. car availability, number of booked airbnbs, number of existing airbnbs and the total driven time (in seconds) in a region on a specific date and hour.

Optional parameters: 
- hour (if not set the whole day is selected)

Example:
~~~
{
  "region_car_detailed_data": [
    {
      "car_avg_availability": 1.0,
      "date": "2020-01-14",
      "number_of_booked_airbnbs": 74,
      "number_of_existing_airbnbs": 137,
      "number_of_rides": 8,
      "region_id": 10,
      "time": "20:00",
      "total_driven_time": 26760.0
    },
    ...
   ]
}
~~~

### Region car movement

`/region_car_movement?date=2020-01-14&hour=20`

Returns the number of rides and the total driven time (in seconds) of a car, that drove from a start region to a stop region on a specific date and hour.

Optional parameters: 
- hour (if not set the whole day is selected)

Example:
~~~
{
  "region_car_movement_data": [
    {
      "date": "2020-01-14",
      "number_of_rides": 1,
      "start_region_id": 16,
      "stop_region_id": 10,
      "time": "20:00",
      "total_driven_time": 38820.0
    },
    ...
   ]
}
~~~


### Region districts

`/regions?date=2020-01-29&time=19`

Returns all regions of munich which are represented as polygons including a colour for visualisation. 
If the date and time parameters are added as well, the colors will be based by the avg availabilty of the share now cars on that date and time.

Optional parameters: 
- date (if date is added, time has to be added as well, e.g. 2020-01-29)
- time (if time is added, date has to be added as well, e.g. 19 (only the hour))

Example:
~~~
{
  "features": [
    {
      "color": [
        135,
        233,
        107
      ],
      "geometry": {
        "coordinates": [
          [
            [
              11.5835343,
              48.1329773
            ],
            [
              11.5835343,
              48.1329773
            ],
            ...
          ]
        ],
        "type": "Polygon"
      },
      "id": "0",
      "name": "Altstadt-Lehel",
      "properties": {
        "region_number": 1
      },
      "type": "Feature"
    },
      ...
  ],
  "type": "FeatureCollection"
}
~~~

### Price factors

`/price-factors`

Suggests the price from one region to another, providing detailed information about additional factors influencing the price.

The body of the post request should contain a json object in the form of:

~~~
{
 "from":"Maxvorstadt",
 "to":"Sendling",
 "date": "2020-01-13T15:45:45.000Z",
 "checkboxOptions":
            { 
            "mvv": true,
            "weather": false,
            "availability": true,
            "airbnb": true,
            "traffic": true
             }
 }
~~~
Explanation of the input:

- from: The name of the starting region
- to: The name of the destination
- date: For which date the information should be provided (currently only influences availability, airbnb and mvv)
If there isn't any airbnb or sharenow information for this date, information for the closest recorded date will be provided.
- checkboxOptions: Specify the factors for the price calculation that should be factored in and returned.
    - mvv: Should public transport information and the modal split be included?
    - weather: Should the weather be included?
    - availability: Should the amount of currently used Sharenow cars in this region be included?
    - airbnb: Should information about airbnbs be included?
    - traffic: Should the congestion level be included?

Example output (if all checkbox options are selected / true):

~~~
{
  "airbnb": {
    "destination_booked_airbnbs": 117,
    "destination_existing_airbnbs": 195,
    "destination_occupancy_rate": 0.6,
    "start_booked_airbnbs": 392,
    "start_existing_airbnbs": 553,
    "start_occupancy_rate": 0.71
  },
  "availability": {
    "destination_availability": 0.5,
    "provision": 0.34,
    "start_availability": 0.67
  },
  "congestion": {
    "heavy": 0.0,
    "low": 0.71,
    "moderate": 0.03,
    "severe": 0.0,
    "unknown": 0.27
  },
  "distance": 6.93,
  "duration": 14,
  "modalSplit": {
    "bike": 0.46,
    "car": 0.38,
    "mvv": 0.16,
    "optimal_bike": 0.51,
    "optimal_car": 0.31,
    "optimal_mvv": 0.18,
    "optimal_price": 8.54
  },
  "mvv": {
    "duration": 29.0,
    "price": 3.3
  },
  "price": 5.79,
  "sharenow": 6.13,
  "taxi": 17.17,
  "weather": {
    "condition": "Partly Cloudy",
    "fair-weather": true,
    "precipitation": 0.0118,
    "temp": 9.99,
    "wind": {
      "bft": 2,
      "description": "Light breeze",
      "speed": 2.85
    }
  }
}
~~~
Explanation of the output:
- airbnb:
    - start-/destination_booked_airbnbs: Number of booked airbnbs in the starting-/destination region
    - start-/destination_existing_airbnbs: Total number of airbnbs in the starting-/destination region (no matter if booked or not)
    - start-/destination_occupancy_rate: Percentage of used airbnbs in the region (compared to the total number of airbnbs)
- availability:
    - start-/destination_availability: Percentage of cars in use in the starting- / destination region
    - provision: A discount for driving in a region with a higher demand (or surcharge for driving into a region with lower demand)
- congestion: Mapbox returns a congestion level (low, moderate, heavy, severe, unknown) for every step within a route.
    These are summed up and weighted by their share of the total distance.
- distance: Distance between start and destination in km
- duration: How long it would take the sharenow car to drive from the start to the destination in minutes (basis for the price)
- modalSplit: Distribution of mode choices, given the price and duration of the alternatives. 
Also returns the optimal price and the modal split associated with it. 
The calculation of the modal split is based on a publication of the Ruhr-university Bochum and can be found [here](https://www.ruhr-uni-bochum.de/verkehrswesen/download/literatur/RUBIT_HE_01_12_11Cit.pdf).
- mvv: Public transport data (price & duration), gathered from the mvg-api
- price: The final (suggested) price
- sharenow: The base/ current price (36ct * duration)
- taxi: The cost for a taxi for this route according to the munich taxi tariffs
- weather: Temperature and additional weather conditions like Wind (beaufort scale (bft)) and rain-/snowfall (precipitation)

### Price Matrix

`/dynamic-price-matrix`

Returns a matrix representing the base prices for all possible combinations of the regions as starting or destination points.
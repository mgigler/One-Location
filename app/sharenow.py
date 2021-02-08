import csv


class ShareNow:

    def __init__(self, vin, type, seats, avgDistance, avgCustomerPerDay, avgPricePerMinute, date, time, longitude,
                 latitude, tankfilling):
        self.vin = vin
        self.type = type
        self.seats = seats
        self.avgDistance = avgDistance
        self.avgCustomerPerDay = avgCustomerPerDay
        self.avgPricePerMinute = avgPricePerMinute
        self.date = date
        self.time = time
        self.latitude = latitude
        self.longitude = longitude
        self.tankfilling = tankfilling

    def serialize(self):
        return {
            'vin': self.vin,
            'type': self.type,
            'seats': self.seats,
            'avgDistance': self.avgDistance,
            'avgCustomerPerDay': self.avgCustomerPerDay,
            'avgPricePerMinute': self.avgPricePerMinute,
            'date': self.date,
            'time': self.time,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'tankfilling': self.tankfilling
        }


class ShareNowAnalysis:
    def __init__(self):

        with open('data/sharenow.csv', 'r', encoding="utf8") as f:
            reader = csv.reader(f)
            your_list = list(reader)
            list_tmp = your_list[1::]

            self.results = []
            for i in list_tmp:
                self.results.append(
                    ShareNow(i[0], i[1], i[2], i[3], i[4],
                             i[5], i[6], i[7], i[8], i[9], i[10])
                )

            defaultcounter = 0
            self.drivenowcounter = 0
            self.car2gocounter = 0

            self.daybookings = {}

            for i in self.results:
                if i.type == 'Drive Now':
                    self.drivenowcounter += 1
                elif i.type == 'Car2Go':
                    self.car2gocounter += 1
                else:
                    defaultcounter += 1

                if self.daybookings.get(i.date) == None:
                    self.daybookings[i.date] = 1
                else:
                    self.daybookings[i.date] += 1

            self.total = self.drivenowcounter + self.car2gocounter + defaultcounter

    def getDriveNowCounter(self):
        return self.drivenowcounter

    def getCar2GoCounter(self):
        return self.car2gocounter

    def getTotalCounter(self):
        return self.total

    def serialize(self):
        return {
            'total': self.total,
            'drivenowcounter': self.drivenowcounter,
            'car2gocounter': self.car2gocounter,
            'daybookings': self.daybookings
        }

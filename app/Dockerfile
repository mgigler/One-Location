FROM python:3
RUN apt-get update && apt-get install -y binutils libproj-dev gdal-bin
COPY requirements.txt /src/requirements.txt
WORKDIR /src
RUN pip install -r requirements.txt
ENV FLASK_APP=app.py
EXPOSE 5000
CMD ["python","-m", "flask", "run", "--host=0.0.0.0"]
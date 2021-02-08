# default config
class BaseConfig(object):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = 'postgresql://onelocation:EUt82sXUYhicJZMI8ZPs@localhost:5432/onelocation'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_AS_ASCII = False
    JSONIFY_PRETTYPRINT_REGULAR = True


class Dev(BaseConfig):
    DEBUG = True


class Docker(BaseConfig):
    SQLALCHEMY_DATABASE_URI = 'postgresql://onelocation:EUt82sXUYhicJZMI8ZPs@db:5432/onelocation'
    DEBUG = False


class DockerLocal(BaseConfig):
    SQLALCHEMY_DATABASE_URI = 'postgresql://onelocation:EUt82sXUYhicJZMI8ZPs@localhost:5432/onelocation'
    DEBUG = False


class Prod(BaseConfig):
    DEBUG = False

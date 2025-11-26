def user_exists(User, email):
    return User.query.filter_by(email=email).first() is not None
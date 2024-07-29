
# FOLDERS STRUCTURE OF OUR MOVIE API PROJECT 
![Initial folders and files setup of movie api](images/initial-folders-setup.png)


# Movie routes 
http://localhost/api/movies/search?title=Moviename
http://localhost/api/movies/298402934273849723  (any movie id store in db)
http://localhost:3000/api/movies/66a73ebec2d17f5c13ca8e37/rate
http://localhost:3000/api/movies/66a73ebec2d17f5c13ca8e37/rate (status = active user can access to this route ) add x-auth-token and add access token value to this header to access this route 
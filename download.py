import urllib.request
def download_image(url, dest):
    req = urllib.request.Request(
        url, 
        data=None, 
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
        }
    )
    try:
        with urllib.request.urlopen(req) as response, open(dest, 'wb') as out_file:
            data = response.read()
            out_file.write(data)
        print(f"Downloaded {dest}")
    except Exception as e:
        print(f"Error downloading {dest}: {e}")

download_image('https://commons.wikimedia.org/wiki/Special:FilePath/Michael_Jackson_1984.jpg?width=800', 'c:/xamppprojs2/htdocs/HStore/media/images/history_pg/mj_king_of_pop.jpg')

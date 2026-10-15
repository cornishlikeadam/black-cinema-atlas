from pathlib import Path
import re,json,urllib.request,urllib.parse,time,concurrent.futures
root=Path(__file__).resolve().parents[1];env={}
for line in (root/'.env.local').read_text().splitlines():
 m=re.match(r'^\s*([A-Z_]+)\s*=\s*(.*?)\s*$',line)
 if m:env[m[1]]=m[2].strip('\"\x27 ')
headers={'accept':'application/json'}
if env.get('TMDB_READ_ACCESS_TOKEN'): headers['Authorization']='Bearer '+env['TMDB_READ_ACCESS_TOKEN']
def api(path,params={}):
 params=dict(params)
 if 'Authorization' not in headers:params['api_key']=env['TMDB_API_KEY']
 url='https://api.themoviedb.org/3/'+path+'?'+urllib.parse.urlencode(params)
 for attempt in range(3):
  try:
   with urllib.request.urlopen(urllib.request.Request(url,headers=headers),timeout=25) as r:return json.load(r)
  except Exception:
   if attempt==2:raise
   time.sleep(1+attempt)
# Themes and locations are editorial discovery labels, not demographic inferences.
rows='''Moonlight|2016|Identity,Coming of age,Black queer stories|Miami
Do the Right Thing|1989|Community,Social commentary,Summer|New York
Get Out|2017|Social commentary,Identity| 
Black Panther|2018|Afrofuturism,Legacy,Adventure|Wakanda
Love & Basketball|2000|Black love,Sports,Coming of age|Los Angeles
Boyz n the Hood|1991|Coming of age,Community|Los Angeles
Friday|1995|Friendship,Community|Los Angeles
Malcolm X|1992|History,Activism,Legacy|New York
Coming to America|1988|Black love,Family|New York
The Color Purple|1985|Family,Resilience,Sisterhood| 
Selma|2014|History,Activism|Selma
Hidden Figures|2016|History,Excellence,Friendship|Hampton
The Best Man|1999|Black love,Friendship|New York
Love Jones|1997|Black love,Art|Chicago
Poetic Justice|1993|Black love,Healing|Los Angeles
Juice|1992|Coming of age,Friendship|New York
Set It Off|1996|Sisterhood,Friendship,Heist|Los Angeles
Waiting to Exhale|1995|Sisterhood,Black love|Phoenix
Soul Food|1997|Family,Community|Chicago
New Jack City|1991|Crime,Community|New York
House Party|1990|Coming of age,Friendship,Music| 
School Daze|1988|College,Identity,Music| 
Crooklyn|1994|Family,Coming of age|New York
She's Gotta Have It|1986|Black love,Art,Identity|New York
Hollywood Shuffle|1987|Social commentary,Art|Los Angeles
Daughters of the Dust|1991|Family,Legacy,History|Sea Islands
Eve's Bayou|1997|Family,Coming of age,Southern stories| 
Boomerang|1992|Black love,Friendship|New York
The Wood|1999|Friendship,Coming of age,Black love|Los Angeles
The Brothers|2001|Friendship,Black love|Los Angeles
Brown Sugar|2002|Black love,Music,Friendship|New York
Deliver Us from Eva|2003|Black love,Sisterhood|Los Angeles
The Photograph|2020|Black love,Art,Legacy|New York
If Beale Street Could Talk|2018|Black love,Social commentary|New York
Queen & Slim|2019|Black love,Social commentary| 
American Fiction|2023|Art,Family,Social commentary|Boston
The Last Black Man in San Francisco|2019|Community,Identity,Art|San Francisco
Sorry to Bother You|2018|Social commentary,Work,Surrealism|Oakland
Soul|2020|Music,Identity,Family|New York
Spider-Man: Into the Spider-Verse|2018|Adventure,Coming of age,Family|New York
Spider-Man: Across the Spider-Verse|2023|Adventure,Coming of age,Family|New York
Creed|2015|Sports,Legacy,Resilience|Philadelphia
Creed II|2018|Sports,Legacy,Family|Philadelphia
Creed III|2023|Sports,Friendship,Legacy|Los Angeles
King Richard|2021|Sports,Family,Excellence|Los Angeles
Remember the Titans|2000|Sports,Community,History|Alexandria
42|2013|Sports,History,Excellence|New York
Ray|2004|Music,History,Legacy| 
What's Love Got to Do with It|1993|Music,Resilience,History| 
Next Friday|2000|Friendship,Family|Los Angeles
Barbershop|2002|Community,Work,Friendship|Chicago
Girls Trip|2017|Sisterhood,Friendship|New Orleans
Think Like a Man|2012|Black love,Friendship|Los Angeles
Ride Along|2014|Family,Friendship|Atlanta
The Woman King|2022|History,Sisterhood,Resilience| 
Judas and the Black Messiah|2021|History,Activism|Chicago
One Night in Miami...|2020|History,Activism,Friendship|Miami
Ma Rainey's Black Bottom|2020|Music,History,Art|Chicago
The Harder They Fall|2021|Western,Revenge| 
Nope|2022|Social commentary,Family,Science fiction| 
Us|2019|Social commentary,Family|Santa Cruz
Candyman|2021|Art,Social commentary|Chicago
Atlantics|2019|Black love,Migration,Supernatural|Dakar
Tsotsi|2005|Resilience,Community|Johannesburg
City of God|2002|Coming of age,Community,Crime|Rio de Janeiro
The Burial|2023|History,Justice| 
Sinners|2025|Music,Southern stories,Supernatural| 
The Six Triple Eight|2024|History,Sisterhood,Excellence| 
BlacKkKlansman|2018|History,Social commentary|Colorado Springs
Da 5 Bloods|2020|History,Friendship,Legacy| 
Bamboozled|2000|Art,Social commentary|New York
The Wiz|1978|Music,Adventure,Family|New York
Cooley High|1975|Coming of age,Friendship|Chicago
Claudine|1974|Black love,Family,Work|New York
Shaft|1971|Crime,Justice|New York
Super Fly|1972|Crime,Community|New York
The Spook Who Sat by the Door|1973|Activism,Social commentary|Chicago
To Sleep with Anger|1990|Family,Southern stories|Los Angeles
A Raisin in the Sun|1961|Family,Legacy,Community|Chicago
Carmen Jones|1954|Music,Black love| 
Sounder|1972|Family,Resilience,Southern stories| 
Buck and the Preacher|1972|Western,Community| 
Devil in a Blue Dress|1995|Crime,Justice|Los Angeles
Dead Presidents|1995|Crime,History|New York
Menace II Society|1993|Coming of age,Community|Los Angeles
Antwone Fisher|2002|Family,Healing,Resilience| 
The Great Debaters|2007|History,Excellence|Marshall
Belle|2013|History,Identity,Black love|London
The Wedding Party|2016|Black love,Family|Lagos
Half of a Yellow Sun|2013|History,Black love| 
Mother of George|2013|Family,Migration|New York
Pariah|2011|Coming of age,Identity,Black queer stories|New York
Rafiki|2018|Black love,Black queer stories|Nairobi
The Watermelon Woman|1996|Art,History,Black queer stories|Philadelphia
Drylongso|1998|Art,Friendship,Community|Oakland
Killer of Sheep|1978|Community,Family,Work|Los Angeles
Sweet Sweetback's Baadasssss Song|1971|Social commentary,Activism|Los Angeles'''
seeds=[line.split('|') for line in rows.splitlines()]
(root/'atlas/data/editorial.json').write_text(json.dumps(seeds,indent=2))
def load(row):
 title,year,themes,city=row
 results=api('search/movie',{'query':title,'primary_release_year':year,'include_adult':'false'}).get('results',[])
 if not results: raise ValueError('No match: '+title)
 best=next((x for x in results if x.get('title','').lower()==title.lower()),results[0])
 d=api('movie/'+str(best['id']),{'append_to_response':'credits,videos,keywords,release_dates'})
 videos=[v for v in d.get('videos',{}).get('results',[]) if v.get('site')=='YouTube' and v.get('type')=='Trailer']
 certs=next((r.get('release_dates',[]) for r in d.get('release_dates',{}).get('results',[]) if r['iso_3166_1']=='US'),[])
 cert=next((r['certification'] for r in certs if r.get('certification')),'Not rated')
 cast=[{'id':x['id'],'name':x['name'],'profile_path':x.get('profile_path'),'role':'ACTED_IN','character':x.get('character')} for x in d.get('credits',{}).get('cast',[])[:12]]
 roles={'Director':'DIRECTED','Writer':'WROTE','Screenplay':'WROTE','Producer':'PRODUCED'}
 crew=[{'id':x['id'],'name':x['name'],'profile_path':x.get('profile_path'),'role':roles[x['job']]} for x in d.get('credits',{}).get('crew',[]) if x.get('job') in roles]
 return {'id':d['id'],'tmdb_id':d['id'],'title':d['title'],'year':int(d['release_date'][:4]),'overview':d['overview'],'runtime':d['runtime'],'poster_path':d.get('poster_path'),'backdrop_path':d.get('backdrop_path'),'rating':d.get('vote_average',0),'popularity':d.get('popularity',0),'trailer_key':videos[0]['key'] if videos else None,'genres':[g['name'] for g in d.get('genres',[])],'themes':themes.split(','),'cities':[city.strip()] if city.strip() else [],'decade':str(int(year)//10*10)+'s','people':cast+crew,'certification':cert,'countries':d.get('origin_country',[]),'source':'TMDB','editorial_source':'Black Cinema Atlas starter collection','updated_at':time.strftime('%Y-%m-%dT%H:%M:%SZ',time.gmtime())}
films=[];failed=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as ex:
 futures={ex.submit(load,row):row for row in seeds}
 for fut in concurrent.futures.as_completed(futures):
  try: films.append(fut.result())
  except Exception as e: failed.append(futures[fut][0])
films.sort(key=lambda f:next((i for i,s in enumerate(seeds) if s[0].lower()==f['title'].lower()),999))
(root/'atlas/data/catalog.json').write_text(json.dumps(films,ensure_ascii=False,separators=(',',':')))
print(json.dumps({'imported':len(films),'failed_titles':failed}))

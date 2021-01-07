# Yahoo Options
## Functionality
- To download options calls and puts data from query1.finance.yahoo.com

## Prerequisite
- Node js
## Install
- navigate to project folder
- install package
> npm install

## Config in index.js
<pre>
const MAX_WEEK = 7;
const QUOTES = ['TSLA']; // target quote
</pre>

## Run
> node index.js

## Data
- https://query1.finance.yahoo.com/v7/finance/options/TSLA?formatted=true&crumb=i1Hpnl6KWkB&lang=en-US&region=UScorsDomain=finance.yahoo.com
- only calls and puts data are stored
- stored in JSON format
- stored contract by contract

##  Destination
	    dest/
        ├── <quote A>
        ├── <quote B>                   
        │   ├── <date>          
        │   ├── <date>         
        │   └── <date> 
        │          └── calls
        │                 └── <contract number>.json
        │                 └── <contract number>.json
        │          └── puts
        │                 └── <contract number>.json
        │                 └── <contract number>.json
        └── ...


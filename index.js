const https = require('https');
const moment = require('moment');
const aws = require('aws-sdk');
const fs = require('fs');
const s3 = new aws.S3();

const placeholderQuote = '%%qoute%%';
const placeholderDate = '%%date%%';
const constPath = '/v7/finance/options/' + placeholderQuote + '?formatted=true&crumb=i1Hpnl6KWkB&lang=en-US&region=US&date=' + placeholderDate + '&corsDomain=finance.yahoo.com';
const options = {
  hostname: 'query1.finance.yahoo.com',
  port: 443,
  path: '',
  
};
const maxWeeks = 7;
const QUOTES = ['TSLA'];

const response = {
  statusCode: 200,
  body: JSON.stringify('Hello from Lambda!'),
};

// store location
const IS_LOCAL = true;
const DIR_CALLS = 'calls';
const DIR_PUTS = 'puts';
// local
const DEST_DIR = 'dest';

// s3
const DESR_BUSKET = 'yahoofinanceoptions';

var putToLocalDir = function(json, fileName) {
    fs.writeFile(fileName, json, (err) => {
      if (err) throw err;
      else {
        console.log(fileName + ' The file has been saved!');
      }
    });
};

var putToS3 = function(json, fileName) {
    try {
        const params = {
            Bucket: DESR_BUSKET,
            Key: fileName,
            Body: json
        };

        s3.upload(params, function(err, data) {
          console.log(err, data);
        });
    } catch (err) {
        throw err;
    }
};

var putFile = function(option, destName, isCalls) {
    //// put to local
    putToLocalDir(JSON.stringify(option), getFileName(option, destName, isCalls));

    //// put to s3
    // putToS3(JSON.stringify(option), getFileName(option, destName, isCalls);
};

/*
    S3 : TSLA/20210108/puts/TSLA210108P01140000.json
    Local dir : dest/TSLA/20210108/puts/TSLA210108P01140000.json
*/
var getFileName = function(option, destName, isCalls) {
    var fileName = destName;

    if (isCalls) {
        fileName += DIR_CALLS + '/';
    } else {
        fileName += DIR_PUTS + '/';
    }

    if (option != '') {
        fileName += option.contractSymbol + '.json';
    } else {
        fileName += 'empty.json';
    }

    return fileName;
};

var getDestName = function(quote, targetFriday) {
    var destName = '';

    if (IS_LOCAL) {
        destName += DEST_DIR + '/';
    }

    destName += quote + '/';

    destName += targetFriday.format('YYYYMMDD') + '/';

    // check and create directory
    if (IS_LOCAL) {
        checkExistence(destName + DIR_CALLS);
        checkExistence(destName + DIR_PUTS);
    }

    return destName;
};

var checkExistence = function(destName) {
    if (!fs.existsSync(destName)) {
        console.log(destName + ' not exists');
         fs.mkdirSync(destName, {recursive: true}, (err) => {
            console.log(err);
            if (err) throw err;
         });   
    } else {
        console.log(destName + ' exists');
    }
};

var httpsGet = function(quote, targetFriday, destName) {
    var url = constPath.replace(placeholderQuote, quote).replace(placeholderDate, targetFriday.unix());
    var targetOptions = options;
    targetOptions.path = url;
    
    https.get(targetOptions, (res) => {
        var jsonString = '';
        
        res.on('data', (d) => {
            jsonString += d;
        });
        
        res.on('end', () => {
            var json = JSON.parse(jsonString);
            
            var optionsArray = json.optionChain.result[0].options[0];
            var calls = optionsArray.calls;
            var puts = optionsArray.puts;

            //// calls
            if (calls.length > 0) {
                calls.forEach(call => {
                    putFile(call, destName, true);   
                });
            } else {
                putFile('', destName, true);   
            }
            
            //// puts
            if (puts.length > 0) {
                puts.forEach(put => {
                    putFile(put, destName, false);   
                });
            } else {
                putFile('', destName, false);   
            }
        });
    }).on('error', (e) => {
        console.log(e);
        throw e;
    });
};

QUOTES.forEach(quote => {
    for(var i = 0; i < maxWeeks; i++) {
      var targetFriday = moment.utc().day(5 + (i * 7)).hour(0).minute(0).second(0).millisecond(0);

      httpsGet(quote, targetFriday, getDestName(quote, targetFriday));
    } 
});


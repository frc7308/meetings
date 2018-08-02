var nodemailer = require('nodemailer');
var fs = require('fs');
const {google} = require('googleapis');
const cheerio = require('cheerio')

function makeCalendarEvent(callback) {
  return new Promise(function(fulfill, reject) {
    var calendar_credentials = JSON.parse(fs.readFileSync('credentials/calendar/credentials.json')).installed;
    var calendar_tokens = JSON.parse(fs.readFileSync('credentials/calendar/token.json'))

    var auth = new google.auth.OAuth2(calendar_credentials.client_id, calendar_credentials.client_secret, calendar_credentials.redirect_uris[0]);
    auth.setCredentials(calendar_tokens);

    const calendar = google.calendar({version: 'v3', auth});
    calendar.events.insert({
      auth: auth,
      calendarId: '33l717ptvke13kcthu90mop1q0@group.calendar.google.com',
      resource: {
        'summary': 'DeepVision Robotics Meeting',
        'description': 'This is a test meeting, it is not real.',
        'location': '11638 Winding Way, Los Altos CA 94024',
        'visibility': 'public',
        'attendees': [
          {'email': '7308deepvision@googlegroups.com'},
        ],
        'start': {
          'dateTime': '2018-07-29T19:00:00',
          'timeZone': 'Etc/GMT+7',
        },
        'end': {
          'dateTime': '2018-07-29T20:00:00',
          'timeZone': 'Etc/GMT+7',
        },
      },
    }, function(err, res) {
      if (err) {
        console.log('Error: ' + err);
        reject(err);
      }
      console.log('Calendar event created:', res.data.htmlLink);
      fulfill(res.data.htmlLink);
    });
  });
}

function sendEmail(link) {
  return new Promise(function(fulfill, reject) {
    var mail_credentials = JSON.parse(fs.readFileSync('credentials/email/credentials.json', 'utf8')).installed;
    var mail_tokens = JSON.parse(fs.readFileSync('credentials/email/token.json', 'utf8'));

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            type: 'OAuth2',
            user: '7308deepvision@gmail.com',
            clientId: mail_credentials.client_id,
            clientSecret: mail_credentials.client_secret,
            refreshToken: mail_tokens.refresh_token,
            accessToken: mail_tokens.access_token,
            expires: mail_tokens.expiry_date
        }
    });

    var messageHTML = fs.readFileSync('email_template.html', 'utf8');
    var messageDOM = cheerio.load(messageHTML);

    var when = "July 29, 2018 from 7:00 PM - 8:00 PM";
    var where = "11638 Winding Way, Los Altos, CA 94024";
    var why = "This is a test meeting, it is not real.";

    messageDOM('p#when').html('<b>When:</b> ' + when);
    messageDOM('p#where').html('<b>Where:</b> ' + where);
    messageDOM('p#why').html('<b>Why:</b> ' + why);
    messageDOM('a#calendar-link').attr('href', link);
    console.log(messageDOM('a#calendar-link').attr('href'));

    var mailOptions = {
      from: 'DeepVision <7308deepvision@gmail.com>',
      to: '7308deepvision@googlegroups.com',
      subject: 'DeepVision Meeting - Add to Your Calendar',
      html: messageDOM.html(),
      attachments: [
          {
              filename: 'logo.png',
              path: 'logo.png',
              cid: 'unique@7308logo'
          },
          {
              filename: 'meeting.png',
              path: 'meeting.png',
              cid: 'unique@meetingicon'
          }]
    };

    transporter.sendMail(mailOptions, function(err, info){
      if (err) {
        console.log(err);
        reject(err)
      }
      console.log('Email sent: ' + info.response);
      fulfill(info.response);
    });
  });
}

async function main() {
  link = await makeCalendarEvent();
  sendEmail(link);
}

main();

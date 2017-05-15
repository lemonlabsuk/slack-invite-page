// es6 runtime requirements
import 'babel-polyfill'

// their code
import express from 'express'
import sockets from 'socket.io'
import { json } from 'body-parser'
import { Server as http } from 'http'
import remail from 'email-regex'
import dom from 'vd'
import cors from 'cors'

// our code
import Slack from './slack'
import invite from './slack-invite'
import badge from './badge'
import splash from './splash'
import iframe from './iframe'
import log from './log'

export default function slackin ({
  token,
  interval = 5000, // jshint ignore:line
  org,
  css,
  coc,
  cors: useCors = true,
  path='/',
  channels,
  emails,
  silent = false // jshint ignore:line,
}){
  // must haves
  if (!token) throw new Error('Must provide a `token`.')
  if (!org) throw new Error('Must provide an `org`.')

  if (channels) {
    // convert to an array
    channels = channels.split(',').map((channel) => {
      // sanitize channel name
      if ('#' === channel[0]) return channel.substr(1)
      return channel
    })
  }

  if (emails) {
    // convert to an array
    emails = emails.split(',')
  }

  // setup app
  let app = express()
  let router = express.Router()
  let srv = http(app)
  srv.app = app

  let assets = __dirname + '/assets'

  // fetch data
  let slack = new Slack({ token, interval, org })

  slack.setMaxListeners(Infinity)

  // capture stats
  log(slack, silent)

  // middleware for waiting for slack
  router.use((req, res, next) => {
    if (slack.ready) return next()
    slack.once('ready', next)
  })

  if (useCors) {
    app.options('https://lemonlabs.io', cors())
    app.use(cors())
  }

  // splash page
  router.get('/', (req, res) => {
    let { name, logo } = slack.org
    let { active, total } = slack.users
    if (!name) return res.send(404)

    // Generated using http://arthurclemens.github.io/mithril-template-converter/index.html
    let nav = dom("nav.navbar.navbar-default style='padding: 10px 0;'",
      dom(".container",
        [
          dom(".navbar-header.page-scroll",
            [
              dom("button.navbar-toggle data-target='#bs-example-navbar-collapse-1' data-toggle='collapse' type='button'",
                [
                  dom("span.sr-only",
                    "Toggle navigation"
                  ),
                  dom("span.icon-bar"),
                  dom("span.icon-bar"),
                  dom("span.icon-bar")
                ]
              )
            ]
          ),
          dom(".collapse.navbar-collapse id='bs-example-navbar-collapse-1'",
            dom("ul.nav.navbar-nav.navbar-right",
              [
                dom("li.hidden",
                  dom("a href='#page-top'")
                ),
                dom("li.page-scroll",
                  dom("a href='//lemonlabs.io/#whatwedo'",
                    "What we do"
                  )
                ),
                dom("li.page-scroll",
                  dom("a href='//lemonlabs.io/#team'",
                    "The team"
                  )
                ),
                dom("li.page-scroll",
                  dom("a href='//lemonlabs.io/#contact'",
                    "Contact"
                  )
                )
              ]
            )
          )
        ]
      )
    );

    let footer = dom("footer.text-center",
      [
        dom(".footer-above",
          dom(".container",
            dom(".row",
              [
                dom(".footer-col.col-md-4",
                  [
                    dom("h3", "Lemon Labs Limited"),
                    dom("p", "Fleet, Hampshire")
                  ]
                ),
                dom(".footer-col.col-md-4",
                  [
                    dom("h3",
                      "Around the Web"
                    ),
                    dom("ul.list-inline",
                      [
                        dom("li",
                          dom("a.btn-social.btn-outline href='http://github.com/lemonlabsuk'",
                            dom("i.fa.fa-fw.fa-github")
                          )
                        ),
                        dom("li",
                          dom("a.btn-social.btn-outline href='https://www.linkedin.com/company/lemon-labs-limited'",
                            dom("i.fa.fa-fw.fa-linkedin")
                          )
                        )
                      ]
                    )
                  ]
                ),
                dom(".footer-col.col-md-4",
                  [
                    dom("h3",
                      "Credits"
                    ),
                    dom("p",
                      [
                        "Modified version of the ",
                        dom("a href='https://github.com/jeromelachaud/freelancer-theme/blob/master/LICENCE'",
                          "Apache 2.0"
                        ),
                        " licensed ",
                        dom("a href='https://github.com/jeromelachaud/freelancer-theme/'",
                          "freelancer"
                        ),
                        " theme for Jekyll"
                      ]
                    )
                  ]
                )
              ]
            )
          )
        ),
        dom(".footer-below",
          dom(".container",
            dom(".row style='margin-bottom:10px;'", dom(".col-lg-12", 'Powered by ', dom('a href=http://rauchg.com/slackin target=_blank', 'slackin'))),
            dom(".row", dom(".col-lg-12", "Copyright © Lemon Labs Limited 2017"))
          )
        )
      ]
    )

    let page = dom('html',
      dom('head',
        dom('title',
          'Join ', name, ' on Slack!'
        ),
        dom('meta name=viewport content="width=device-width,initial-scale=1.0,minimum-scale=1.0,user-scalable=no"'),
        dom('link rel="shortcut icon" href=//lemonlabs.io/img/favicon.ico'),
        css && dom('link rel=stylesheet', { href: css }),
        dom('link rel="stylesheet" href="//lemonlabs.io/css/font-awesome/css/font-awesome.min.css"'),
        dom('link href="//fonts.googleapis.com/css?family=Montserrat:400,700" rel="stylesheet" type="text/css"'),
        dom('link href="//fonts.googleapis.com/css?family=Lato:400,700,400italic,700italic" rel="stylesheet" type="text/css"'),
        dom('link rel="stylesheet" href="//lemonlabs.io/style.css"')
      ),
      nav,
      splash({ coc, path, css, name, org, logo, channels, active, total }),
      footer
    )
    res.type('html')
    res.send(page.toHTML())
  })

  router.get('/data', (req, res) => {
    let { name, logo } = slack.org
    let { active, total } = slack.users
    res.send({
      name,
      org,
      coc,
      logo,
      channels,
      active,
      total
    })
  })

  // static files
  router.use('/assets', express.static(assets))

  // invite endpoint
  router.post('/invite', json(), (req, res, next) => {
    let chanId
    if (channels) {
      let channel = req.body.channel
      if (!channels.includes(channel)) {
        return res
        .status(400)
        .json({ msg: 'Not a permitted channel' })
      }
      chanId = slack.getChannelId(channel)
      if (!chanId) {
        return res
        .status(400)
        .json({ msg: `Channel not found "${channel}"` })
      }
    }

    let email = req.body.email

    if (!email) {
      return res
      .status(400)
      .json({ msg: 'No email provided' })
    }

    if (!remail().test(email)) {
      return res
      .status(400)
      .json({ msg: 'Invalid email' })
    }

    // Restricting email invites?
    if (emails && emails.indexOf(email) === -1) {
      return res
      .status(400)
      .json({ msg: 'Your email is not on the accepted email list' })
    }

    if (coc && '1' != req.body.coc) {
      return res
      .status(400)
      .json({ msg: 'Agreement to CoC is mandatory' })
    }

    invite({ token, org, email, channel: chanId }, err => {
      if (err) {
        if (err.message === `Sending you to Slack...`) {
          return res
          .status(303)
          .json({ msg: err.message, redirectUrl: `https://${org}.slack.com` })
        }

        return res
        .status(400)
        .json({ msg: err.message })
      }

      res
      .status(200)
      .json({ msg: 'WOOT. Check your email!' })
    })
  })

  // iframe
  router.get('/iframe', (req, res) => {
    let large = 'large' in req.query
    let { active, total } = slack.users
    res.type('html')
    res.send(iframe({ path, active, total, large }).toHTML())
  })

  router.get('/iframe/dialog', (req, res) => {
    let large = 'large' in req.query
    let { name } = slack.org
    let { active, total } = slack.users
    if (!name) return res.send(404)
    let dom = splash({ coc, path, name, org, channels, active, total, large, iframe: true })
    res.type('html')
    res.send(dom.toHTML())
  })

  router.get('/.well-known/acme-challenge/:id', (req, res) => {
    res.send(process.env.LETSENCRYPT_CHALLENGE)
  })

  // badge js
  router.use('/slackin.js', express.static(assets + '/badge.js'))

  // badge rendering
  router.get('/badge.svg', (req, res) => {
    res.type('svg')
    res.set('Cache-Control', 'max-age=0, no-cache')
    res.set('Pragma', 'no-cache')
    res.send(badge(slack.users).toHTML())
  })

  // realtime
  sockets(srv, {path: path + 'socket.io'}).on('connection', socket => {
    socket.emit('data', slack.users)
    let change = (key, val) => socket.emit(key, val)
    slack.on('change', change)
    socket.on('disconnect', () => {
      slack.removeListener('change', change)
    })
  })

  app.use(path, router);

  return srv
}

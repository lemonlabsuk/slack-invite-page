import dom from 'vd'

export default function splash ({ path, name, org, coc, logo, active, total, channels, large, iframe }){
  let div = dom('section style="padding: 30px 0"', dom('div.container',
    dom('div.row', dom('div.col-lg-12.text-center',
      dom('h2', 'Fancy a chat?'),
      dom('hr.star-primary')
    )),
    dom('div.row', dom('div.col-lg-12.text-center',
    dom('p',
      'Join ', dom('b', name),
      // mention single single-channel inline
      channels && channels.length === 1 && dom('span', ' #', channels[0]),
      ' on Slack.'
    ),
    dom('p.status',
      active
        ? [
          dom('b.active', active), ' users online now of ',
          dom('b.total', total), ' registered.'
        ]
        : [dom('b.total', total), ' users are registered so far.']
    ),
    dom('form id=invite',
      channels && (
        channels.length > 1
          // channel selection when there are multiple
          ? dom('select.form-item name=channel',
              channels.map(channel => {
                return dom('option', { value: channel, text: channel })
              })
            )
          // otherwise a fixed channel
          : dom('input type=hidden name=channel', { value: channels[0] })
      ),
      dom('input.form-item.input-lg type=email name=email placeholder=you@yourdomain.com style="margin-bottom: 15px;" '
        + (!iframe ? 'autofocus' : '')),
      coc && dom('.coc',
        dom('label',
          dom('input type=checkbox name=coc value=1'),
          'I agree to the ',
          dom('a', { href: coc, target: '_blank' }, 'Code of Conduct'),
          '.'
        )
      ),
      dom('button.loading.btn.btn-success.btn-lg style="margin-left:5px; margin-top:-5px"', 'Get my Invite')
    ),
    dom('p.signin',
      'or ',
      dom(`a href=https://${org}.slack.com target=_top`, 'sign in')
    )
    )),
    style({ path, logo, active, large, iframe }),
    // xxx: single build
    dom('script', `
      data = {};
      data.path = ${JSON.stringify(path)};
    `),
    dom('script src=https://cdn.socket.io/socket.io-1.4.4.js'),
    dom(`script src=${path}assets/superagent.js`),
    dom(`script src=${path}assets/client.js`)
  ))
  return div
}

const pink = '#E01563'

function style ({ path, logo, active, large, iframe } = {}){
  var css = dom.style()

  css.add('.splash', {
    'width': iframe ? '25rem' : '30rem',
    'margin': iframe ? '0' : '20rem auto',
    'text-align': 'center',
    'font-family': '"Helvetica Neue", Helvetica, Arial'
  })

  if (iframe) {
    css.add('.splash', {
      'box-sizing': 'border-box',
      'padding': '1rem'
    })
  }

  css.add('.logos', {
    'position': 'relative',
    'margin-bottom': '4rem'
  })

  if (!iframe) {
    css.add('.logo', {
      'width': '4.8rem',
      'height': '4.8rem',
      'display': 'inline-block',
      'background-size': 'cover',
      'border-radius': '5px'
    })

    css.add('.logo.slack', {
      'background-image': 'url(' + path + 'assets/slack.svg)'
    })

    if (logo) {
      let pw = 1 // '+' width in rem
      let lp = 3 // logos separation in rem

      css.add('.logo.org::after', {
        'position': 'absolute',
        'display': 'block',
        'content': '"+"',
        'top': '1.5rem',
        'left': '0',
        'width': '30rem',
        'text-align': 'center',
        'color': '#D6D6D6',
        'font-size': '1.5rem', // can't use rem in font shorthand IE9-10
              // http://codersblock.com/blog/font-shorthand-bug-in-ie10/
        'font-family': 'Helvetica Neue'
      })

      css.add('.logo.org', {
        'background-image': `url(${logo})`,
        'margin-right': `${lp + pw + lp}rem`
      })

      css.add('hr.star-primary:after', {
        'top': '-0.48em'
      })
    }
  }

  css.add('.coc', {
    'font-size': '1.2rem',
    padding: '1.5rem 0 .5rem',
    color: '#666'
  })

  if (iframe) {
    css.add('.coc', {
      'font-size': '1.1rem',
      'padding-top': '1rem'
    })

    css.add('.coc input', {
      position: 'relative',
      top: '-.2rem'
    })
  }

  css.add('.coc label', {
    cursor: 'pointer'
  })

  css.add('.coc input', {
    'appearance': 'none',
    '-webkit-appearance': 'none',
    border: 'none',
    'vertical-align': 'middle',
    margin: '0 .5rem 0 0'
  })

  css.add('.coc input::after', {
    content: '""',
    display: 'inline-block',
    width: '1.5rem',
    height: '1.5rem',
    'vertical-align': 'middle',
    background: 'url(' + path + 'assets/checkbox.svg)',
    cursor: 'pointer'
  })

  css.add('.coc input:checked::after', {
    'background-position': 'right'
  })

  css.add('.coc a', {
    color: '#666'
  })

  css.add('.coc a:hover', {
    'background-color': '#666',
    'text-decoration': 'none',
    color: '#fff'
  })

  if (iframe) {
    css.add('p.status', {
      'font-size': '1.1rem'
    })
  }

  css.add('select', {
    'background': 'none'
  })

  css.add('button', {
    'transition': 'background-color 150ms ease-in, color 150ms ease-in'
  })

  css.add('button.loading', {
    'pointer-events': 'none'
  })

  css.add('button:disabled', {
    'color': '#9B9B9B',
    'background-color': '#D6D6D6',
    'cursor': 'default',
    'pointer-events': 'none'
  })

  css.add('button.error', {
    'background-color': '#F4001E',
    'text-transform': 'none'
  })

  css.add('button.success:disabled', {
    'color': '#fff',
    'background-color': '#68C200'
  })

  css.add('button:not(.disabled):active', {
    'background-color': '#7A002F'
  })

  css.add('b', {
    'transition': 'transform 150ms ease-in'
  })

  css.add('b.grow', {
    'transform': 'scale(1.3)'
  })

  css.add('form', {
    'margin-top': iframe ? '1rem' : '2rem',
    'margin-bottom': '0'
  })

  css.add('input', {
    'color': '#9B9B9B',
    'border': '.1rem solid #D6D6D6'
  })

  if (iframe) {
    css.add('button, .form-item', {
      'height': '2.8rem',
      'line-height': '2.8rem',
      'padding': 0,
      'font-size': '1.1rem'
    })
  }

  css.add('input:focus', {
    'color': '#666',
    'border-color': '#999',
    'outline': '0'
  })

  if (active) {
    css.add('.active', {
      'color': pink
    })
  }

  css.add('p.signin', {
    'padding': '1rem 0 1rem'
  })

  css.add('p.signin a', {
    'color': pink,
    'text-decoration': 'none'
  })

  css.add('p.signin a:hover', {
    'background-color': '#E01563',
    color: '#fff'
  })

  css.add('.fa', {
    'line-height': '2.2em'
  })

  return css
}

/* Shared invitation actions; platform-independent helpers stay testable. */
'use strict';

function showToast(msg, {doc = document, frame = requestAnimationFrame, schedule = setTimeout, cancel = clearTimeout} = {}){
  let t = doc.getElementById('wed-toast');
  if(!t){
    t = doc.createElement('div');
    t.id = 'wed-toast';
    t.setAttribute('role', 'status');
    t.setAttribute('aria-live', 'polite');
    t.setAttribute('aria-atomic', 'true');
    doc.body.appendChild(t);
  }
  t.textContent = '';
  frame(()=>{
    t.textContent = msg;
    t.style.opacity = '1';
    t.style.transform = 'translateX(-50%) translateY(0)';
  });
  cancel(t._hideTimer);
  t._hideTimer = schedule(()=>{
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(10px)';
  }, 4000);
}

function calendarTimestamp(value){
  if (!/^\d{8}T\d{6}Z$/.test(value)) throw new Error('Invalid calendar timestamp');
  const iso = `${value.slice(0,4)}-${value.slice(4,6)}-${value.slice(6,8)}T${value.slice(9,11)}:${value.slice(11,13)}:${value.slice(13,15)}.000Z`;
  const time = Date.parse(iso);
  if (!Number.isFinite(time) || new Date(time).toISOString() !== iso) throw new Error('Invalid calendar date');
  return time;
}

function escapeCalendarText(value){
  return String(value).replace(/\\/g,'\\\\').replace(/\r\n|\r|\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
}

// RFC 5545 folds at 75 octets, not 75 characters; keep Tamil and emoji intact.
function foldCalendarLine(line){
  const encoder = new TextEncoder();
  let output = '', bytes = 0;
  for (const character of line) {
    const size = encoder.encode(character).length;
    if (bytes + size > 75) { output += '\r\n '; bytes = 1; }
    output += character;
    bytes += size;
  }
  return output;
}

function buildCalendar({uid, title, description, location, startUTC, endUTC}, stamp){
  if (!/^[a-zA-Z0-9@._-]+$/.test(uid)) throw new Error('Invalid calendar identifier');
  if (calendarTimestamp(endUTC) <= calendarTimestamp(startUTC)) throw new Error('Invalid calendar interval');
  calendarTimestamp(stamp);
  return [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Shankar & Haripriya Wedding//EN','CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${startUTC}`,
    `DTEND:${endUTC}`,
    `SUMMARY:${escapeCalendarText(title)}`,
    `DESCRIPTION:${escapeCalendarText(description)}`,
    `LOCATION:${escapeCalendarText(location)}`,
    'END:VEVENT','END:VCALENDAR'
  ].map(foldCalendarLine).join('\r\n') + '\r\n';
}

function downloadICS(event){
  const stamp = new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');
  const ics = buildCalendar(event, stamp);
  const blob = new Blob([ics], {type:'text/calendar;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = event.title.replace(/[^\p{L}\p{N}._-]+/gu,'_') + '.ics';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
  showToast('Calendar file prepared. Open it to add the event.');
}

function addWeddingToCalendar(){
  const c = WEDDING_CONFIG;
  downloadICS({
    uid: 'wedding-shankar-haripriya-2026@shankarharipriya.wedding',
    title: `${c.couple.groom.name} & ${c.couple.bride.name} — Wedding`,
    description: `${c.wedding.label}. ${c.closing}`,
    location: `${c.wedding.venueName}, ${c.wedding.venueAddress}`,
    startUTC: c.wedding.icsStartUTC,
    endUTC: c.wedding.icsEndUTC
  });
}
function addReceptionToCalendar(){
  const c = WEDDING_CONFIG;
  downloadICS({
    uid: 'reception-shankar-haripriya-2026@shankarharipriya.wedding',
    title: `${c.couple.groom.name} & ${c.couple.bride.name} — Reception`,
    description: `Wedding Reception. ${c.closing}`,
    location: `${c.reception.venueName}, ${c.reception.venueAddress}`,
    startUTC: c.reception.icsStartUTC,
    endUTC: c.reception.icsEndUTC
  });
}

function revealShareLink(url, doc = document){
  doc.getElementById('share-link-panel').hidden = false;
  const field = doc.getElementById('share-link-value');
  field.value = url;
  field.focus();
  field.select();
}

async function shareWithFallback({data, nav, notify, showLink}){
  if (new URL(data.url).protocol !== 'https:') throw new Error('Invalid invitation URL');
  if (typeof nav.share === 'function') {
    try { await nav.share(data); return 'shared'; }
    catch (error) { if (error && error.name === 'AbortError') return 'cancelled'; }
  }
  if (nav.clipboard && typeof nav.clipboard.writeText === 'function') {
    try { await nav.clipboard.writeText(data.url); notify('Invitation link copied.'); return 'copied'; }
    catch { /* Browser permissions can block copying; leave a selectable link. */ }
  }
  showLink(data.url);
  return 'manual';
}

function shareInvite(){
  const c = WEDDING_CONFIG;
  const shareData = {
    title: c.site.title,
    text: `You're invited to ${c.couple.groom.name} & ${c.couple.bride.name}'s wedding — ${c.wedding.dateDisplay}`,
    url: c.site.url
  };
  return shareWithFallback({data:shareData, nav:navigator, notify:showToast, showLink:revealShareLink})
    .catch(() => showToast('The invitation link is unavailable. Please try again later.'));
}

/* Populate any element carrying data-cfg="dot.path.into.WEDDING_CONFIG" */
function hydrateConfig(root=document, config=WEDDING_CONFIG){
  root.querySelectorAll('[data-cfg]').forEach(el=>{
    const path = el.getAttribute('data-cfg').split('.');
    let val = config;
    for(const k of path){ val = val && val[k]; }
    if(val != null){
      if(el.tagName === 'A') el.href = val; else el.textContent = val;
    }
  });
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {buildCalendar, shareWithFallback, showToast, revealShareLink, hydrateConfig, addWeddingToCalendar, addReceptionToCalendar, shareInvite};
}

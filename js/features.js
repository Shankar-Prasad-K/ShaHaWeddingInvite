/* ═══════════════════════════════════════════════════════════
   Shared helpers used across all pages: calendar export,
   native share, RSVP link building, a small toast, reduced-
   motion detection, and keyboard-operable interactive doors.
═══════════════════════════════════════════════════════════ */

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function showToast(msg){
  let t = document.getElementById('wed-toast');
  if(!t){
    t = document.createElement('div');
    t.id = 'wed-toast';
    t.style.cssText = `
      position:fixed;left:50%;bottom:28px;transform:translateX(-50%) translateY(10px);
      background:rgba(20,15,10,0.92);color:#FFE8B0;border:1px solid rgba(212,175,55,0.4);
      padding:10px 20px;border-radius:3px;font-family:'Cormorant Garamond',Georgia,serif;
      font-size:14px;letter-spacing:0.04em;z-index:9999;opacity:0;
      transition:opacity 0.35s ease, transform 0.35s ease;pointer-events:none;`;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  requestAnimationFrame(()=>{
    t.style.opacity = '1';
    t.style.transform = 'translateX(-50%) translateY(0)';
  });
  clearTimeout(t._hideTimer);
  t._hideTimer = setTimeout(()=>{
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(10px)';
  }, 2400);
}

function downloadICS({title, description, location, startUTC, endUTC}){
  const ics = [
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Shankar & Haripriya Wedding//EN','CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}-${Math.random().toString(36).slice(2)}@shankarharipriya.wedding`,
    `DTSTAMP:${startUTC}`,
    `DTSTART:${startUTC}`,
    `DTEND:${endUTC}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description.replace(/\n/g,'\\n')}`,
    `LOCATION:${location.replace(/\n/g,', ')}`,
    'END:VEVENT','END:VCALENDAR'
  ].join('\r\n');
  const blob = new Blob([ics], {type:'text/calendar;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = title.replace(/\s+/g,'_') + '.ics';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
  showToast('Calendar event downloaded ✓');
}

function addWeddingToCalendar(){
  const c = WEDDING_CONFIG;
  downloadICS({
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
    title: `${c.couple.groom.name} & ${c.couple.bride.name} — Reception`,
    description: `Wedding Reception. ${c.closing}`,
    location: `${c.reception.venueName}, ${c.reception.venueAddress}`,
    startUTC: c.reception.icsStartUTC,
    endUTC: c.reception.icsEndUTC
  });
}

function shareInvite(){
  const c = WEDDING_CONFIG;
  const shareData = {
    title: c.site.title,
    text: `You're invited to ${c.couple.groom.name} & ${c.couple.bride.name}'s wedding — ${c.wedding.dateDisplay}`,
    url: c.site.url
  };
  if(navigator.share){
    navigator.share(shareData).catch(()=>{});
  } else if(navigator.clipboard){
    navigator.clipboard.writeText(shareData.url).then(()=>showToast('Link copied ✓')).catch(()=>showToast(shareData.url));
  } else {
    showToast(shareData.url);
  }
}

function rsvpLink(){
  const c = WEDDING_CONFIG.rsvp;
  return `https://wa.me/${c.whatsappNumber}?text=${encodeURIComponent(c.message)}`;
}

/* Populate any element carrying data-cfg="dot.path.into.WEDDING_CONFIG" */
function hydrateConfig(root=document){
  root.querySelectorAll('[data-cfg]').forEach(el=>{
    const path = el.getAttribute('data-cfg').split('.');
    let val = WEDDING_CONFIG;
    for(const k of path){ val = val && val[k]; }
    if(val != null){
      if(el.tagName === 'A') el.href = val; else el.textContent = val;
    }
  });
}

/* Make a click-only interactive element (e.g. a door stage) also
   operable by keyboard — Enter/Space triggers the same handler,
   and it becomes a real tab stop with a visible focus ring. */
function makeKeyboardActivatable(el, handler, label){
  el.setAttribute('role','button');
  el.setAttribute('tabindex','0');
  if(label) el.setAttribute('aria-label', label);
  el.addEventListener('keydown', e=>{
    if(e.key === 'Enter' || e.key === ' '){
      e.preventDefault();
      handler();
    }
  });
}

/* Simple loading screen: fades out once the window has loaded
   (fonts, the hero image, etc.), with a floor on how briefly it
   can show so it never just flickers. */
function initLoader(){
  const loader = document.getElementById('loader');
  if(!loader) return;
  const minShow = prefersReducedMotion ? 0 : 700;
  const shownAt = performance.now();
  function hide(){
    const elapsed = performance.now() - shownAt;
    const wait = Math.max(0, minShow - elapsed);
    setTimeout(()=>{
      loader.style.opacity = '0';
      setTimeout(()=>loader.remove(), prefersReducedMotion ? 0 : 500);
    }, wait);
  }
  if(document.readyState === 'complete') hide();
  else window.addEventListener('load', hide);
}

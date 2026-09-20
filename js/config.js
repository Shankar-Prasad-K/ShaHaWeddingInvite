/* ═══════════════════════════════════════════════════════════
   WEDDING_CONFIG — single source of truth for all editable text.
   Change names, dates, venues, hosts, or RSVP contact here;
   every page reads from this file at load time.

   Calendar times are stored pre-converted to UTC (India is
   UTC+5:30, fixed, no DST) so the .ics files are correct
   regardless of the guest's own timezone.
═══════════════════════════════════════════════════════════ */
const WEDDING_CONFIG = {
  site: {
    title: "Shankar Prasad & Haripriya",
    url: "https://shankarprasadk.github.io/ShaHaWeddingInvite/" // update after deploying
  },

  couple: {
    groom: { honorific: "Selvan", name: "Shankar Prasad K", role: "Manager, Deloitte Chennai" },
    bride: { honorific: "Selvi", name: "Haripriya V", role: "Senior HR, eClerx, Coimbatore", parents: "D/o Mr. V. Venkatesh (Late) – Mrs. V. Shanthi" }
  },

  hosts: "Mrs. Devi Kumaravel & Mr. V. Kumaravel",
  closing: "With best compliments from Friends & Relatives",

  wedding: {
    dateDisplay: "Friday, 20th November 2026",
    timeDisplay: "6:00 AM – 7:30 AM",
    label: "Subha Muhurtham",
    venueName: "Sri Aadhi Sivalayam · Murugan Sannidhanam",
    venueAddress: "Near Vinayagapuram K.G. Bakery Bus Stop, Sivaram Nagar, Coimbatore",
    mapLink: "https://share.google/5LpDdYQeVHZ9qTApS",
    icsStartUTC: "20261120T003000Z",
    icsEndUTC:   "20261120T020000Z"
  },

  reception: {
    dateDisplay: "Friday, 20th November 2026",
    timeDisplay: "6:00 PM – 9:00 PM",
    venueName: "GP Grand Galaxy",
    venueAddress: "Near G.P. Signal, Ganthipuram, Sathy Road, Coimbatore",
    mapLink: "https://share.google/MLjErDc9WtHHSo3wP",
    icsStartUTC: "20261120T123000Z",
    icsEndUTC:   "20261120T153000Z"
  },

  schedule: [
    { event: "Betrothal", date: "18 Nov 2026 (Wed)", time: "4:30 – 6:00 AM" },
    { event: "Muhurtham", date: "20 Nov 2026 (Fri)", time: "6:00 – 7:30 AM" },
    { event: "Reception", date: "20 Nov 2026 (Fri)", time: "6:00 PM onwards" }
  ],

  // WhatsApp number guests can RSVP to (from the printed invitation card).
  // Change this to whichever number should receive RSVPs.
  rsvp: {
    whatsappNumber: "919840454710",
    message: "Hi! We're delighted to confirm our attendance at Shankar & Haripriya's wedding 🎉"
  }
};

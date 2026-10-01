/* ═══════════════════════════════════════════════════════════
   WEDDING_CONFIG — single source of truth for all editable text.
  Change names, dates, venues or hosts here;
   every page reads from this file at load time.

   Calendar times are stored pre-converted to UTC (India is
   UTC+5:30, fixed, no DST) so the .ics files are correct
   regardless of the guest's own timezone.
═══════════════════════════════════════════════════════════ */
const WEDDING_CONFIG = {
  site: {
    title: "Shankar Prasad & Haripriya",
    url: "https://shankar-prasad-k.github.io/ShaHaWeddingInvite/"
  },

  couple: {
    groom: { honorific: "Selvan", name: "Shankar Prasad K", role: "Manager, Deloitte Chennai" },
    bride: { honorific: "Selvi", name: "Haripriya V", role: "Senior HR, eClerx, Coimbatore", parents: "D/o Mrs. V. Shanthi & Mr. V. Venkatesh (Late)" }
  },

  hosts: "Mrs. Devi Kumaravel & Mr. V. Kumaravel",
  closing: "With best compliments from Friends & Relatives",

  wedding: {
    dateDisplay: "Friday, 20th November 2026",
    timeDisplay: "6:00 AM – 7:30 AM",
    label: "Subha Muhurtham",
    venueName: "Sri Aadhi Sivalayam · Murugan Sannidhanam",
    venueAddress: "Near Vinayagapuram K.G. Bakery Bus Stop, Sivaram Nagar, Coimbatore",
    mapLink: "https://share.google/n43wNhqH8ZwYTdRaE",
    icsStartUTC: "20261120T003000Z",
    icsEndUTC:   "20261120T020000Z"
  },

  reception: {
    dateDisplay: "Friday, 20th November 2026",
    timeDisplay: "6:30 PM onwards",
    venueName: "GP Grand Galaxy",
    venueAddress: "Near G.P. Signal, Ganthipuram, Sathy Road, Coimbatore",
    mapLink: "https://share.google/MLjErDc9WtHHSo3wP",
    icsStartUTC: "20261120T130000Z",
    icsEndUTC:   "20261120T153000Z"
  },

  schedule: [
    { event: "Betrothal", date: "18 Nov 2026 (Wed)", time: "4:30 – 6:00 AM" },
    { event: "Muhurtham", date: "20 Nov 2026 (Fri)", time: "6:00 – 7:30 AM" },
    { event: "Reception", date: "20 Nov 2026 (Fri)", time: "6:00 PM onwards" }
  ]
};

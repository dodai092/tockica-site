import { hrDate } from './time.js';
import { descriptorLine } from './schedule.js';
import { taughtBy } from './payroll.js';

// Working name from ADR 0005, not final.
export const APP_URL = 'https://rezervacije.tockicanai.hr/';
const HOUR_MS = 60 * 60 * 1000;
const timeFormat = hrDate({ hour: '2-digit', minute: '2-digit' });
const dateFormat = hrDate({ weekday: 'long', day: 'numeric', month: 'numeric' });

const firstName = (account) => account.name.split(' ')[0];
const when = (session) => `${dateFormat.format(new Date(session.startsAt))} u ${timeFormat.format(new Date(session.startsAt))}`;
const bike = (booking) => `bicikl ${booking.bikeNo}${booking.guestName ? ` (${booking.guestName})` : ''}`;

export const ARRIVE_EARLY = 'Dođi 10 minuta prije početka.';

export function instructorLine(store, session) {
  const name = (store.instructors ?? []).find((i) => i.id === taughtBy(session))?.name;
  return name ? `Trener: ${name.split(' ')[0]}.` : '';
}

// A guest has no account, so they sign the waiver at the desk. Said once per booking until it is signed.
export function guestWaiverLine(store, booking) {
  const signed = (store.waivers ?? []).some((w) => w.bookingId === booking.id);
  return booking.guestName && !signed ? `${booking.guestName} potpisuje izjavu na recepciji ako vozi prvi put.` : '';
}

// Mail texts for one booking. `deadline` is the last moment a cancel is free.
// The late-cancel line says a class is charged, which is true with and without credits.
const notes = (store, booking, session) => [instructorLine(store, session), guestWaiverLine(store, booking)].filter(Boolean).map((l) => `\n${l}`).join('');

export function confirmationMail(store, booking, session, account, deadline) {
  const hours = (Date.parse(session.startsAt) - deadline.getTime()) / HOUR_MS;
  return {
    to: account.email,
    subject: `Rezervirano: ${descriptorLine(session)}`,
    body: `Bok ${firstName(account)},\n\nrezervirano: ${descriptorLine(session)}, ${when(session)}, ${bike(booking)}.${notes(store, booking, session)}\n\nOtkazivanje je besplatno do ${timeFormat.format(deadline)}, ${dateFormat.format(deadline)} (${hours} sati prije treninga).\n\nTočkica na i`,
    action: { label: 'Otkaži rezervaciju', url: `${store.settings.appUrl ?? APP_URL}#racun/otkazi/${booking.id}` },
  };
}

export function cancellationMail(booking, session, account, free, hours) {
  const outcome = free
    ? 'Otkazano na vrijeme, bez naplate.'
    : `Otkazano manje od ${hours} sati prije treninga, naplaćuje se jedan trening.`;
  return {
    to: account.email,
    subject: `Otkazano: ${descriptorLine(session)}`,
    body: `Bok ${firstName(account)},\n\notkazana je rezervacija: ${descriptorLine(session)}, ${when(session)}, ${bike(booking)}.\n\n${outcome}\n\nTočkica na i`,
  };
}

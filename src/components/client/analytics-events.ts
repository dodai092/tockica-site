type AnalyticsWindow = Window &
  typeof globalThis & {
    __awEventsInstalled?: boolean;
    gtag?: (...args: unknown[]) => void;
  };

const VALUES: Record<string, readonly string[]> = {
  placement: ['header', 'hero', 'body', 'footer', 'contact_form'],
  label: ['primary_cta', 'secondary_cta', 'contact', 'brochure'],
  destination_type: ['internal', 'external', 'phone', 'email', 'file', 'form'],
  file_name: ['brochure.pdf', 'price_list.pdf'],
};
const CLICK_EVENTS = new Set(['cta_click', 'phone_click', 'email_click', 'file_download']);

export function installAnalyticsEvents(win: AnalyticsWindow): void {
  if (win.__awEventsInstalled) return;
  win.__awEventsInstalled = true;
  const doc = win.document;

  const emit = (name: string, element: Element) => {
    const init = doc.getElementById('ga-init');
    if (!init?.dataset.id || typeof win.gtag !== 'function') return;
    try {
      if (win.awAnalytics) {
        if (typeof win.awAnalytics.status !== 'function' || win.awAnalytics.status() !== 'granted') return;
      } else if (init.dataset.consent === 'required') return;
    } catch {
      return;
    }
    const params: Record<string, string> = {};
    for (const [key, allowed] of Object.entries(VALUES)) {
      const value = element.getAttribute('data-aw-' + key.replace(/_/g, '-'));
      if (value === null) continue;
      const pattern = key === 'file_name' ? /^[a-z][a-z0-9_]{0,27}\.pdf$/ : /^[a-z][a-z0-9_]{0,31}$/;
      if (value.length > 32 || !pattern.test(value) || !allowed.includes(value)) return;
      params[key] = value;
    }
    const destination = params.destination_type;
    if (name === 'cta_click' && !['internal', 'external'].includes(destination)) return;
    if (name === 'phone_click' && destination !== 'phone') return;
    if (name === 'email_click' && destination !== 'email') return;
    if (name === 'file_download' && (destination !== 'file' || !params.file_name)) return;
    if (name !== 'file_download' && params.file_name !== undefined) return;
    if (['contact_submit', 'generate_lead'].includes(name) && destination !== 'form') return;
    win.gtag('event', name, params);
  };

  doc.addEventListener(
    'click',
    (event) => {
      const target = event.target instanceof win.Element ? event.target : null;
      const element = target?.closest('[data-aw-event]');
      if (!(element instanceof win.HTMLAnchorElement || element instanceof win.HTMLButtonElement)) return;
      const name = element.getAttribute('data-aw-event') ?? '';
      if (!CLICK_EVENTS.has(name)) return;
      if (name !== 'cta_click' && !(element instanceof win.HTMLAnchorElement)) return;
      emit(name, element);
    },
    true
  );

  doc.addEventListener(
    'submit',
    (event) => {
      const form = event.target;
      if (
        !(form instanceof win.HTMLFormElement) ||
        form.getAttribute('data-aw-event') !== 'contact_submit' ||
        !form.checkValidity()
      )
        return;
      emit('contact_submit', form);
    },
    true
  );

  doc.addEventListener('aw:lead-success', (event) => {
    const form = event.target;
    if (!(form instanceof win.HTMLFormElement) || form.getAttribute('data-aw-event') !== 'contact_submit') return;
    emit('generate_lead', form);
  });
}

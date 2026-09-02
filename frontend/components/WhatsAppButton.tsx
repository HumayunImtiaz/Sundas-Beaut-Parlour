import { RiWhatsappFill } from 'react-icons/ri';
import { getWhatsAppLink } from '@/lib/data';

export function WhatsAppButton() {
  return <a className="whatsapp-float" href={getWhatsAppLink('Hello Sundas Beauty Parlour, I would like to book a visit.')} aria-label="Book on WhatsApp" title="Book on WhatsApp"><RiWhatsappFill aria-hidden="true" /></a>;
}

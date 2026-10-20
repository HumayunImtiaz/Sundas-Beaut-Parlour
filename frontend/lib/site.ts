const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '923087986760';

export function getWhatsAppLink(message: string) {
  if (!whatsappNumber) return '#contact';
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}
/** RecruitKr's candidate line on WhatsApp (wa.me takes digits only, no "+"). */
export const HIRING_PARTNER_WHATSAPP = "919636315150";

/** Opens a WhatsApp chat with the hiring partner, message pre-filled. */
export const whatsappLink = (text: string) =>
  `https://wa.me/${HIRING_PARTNER_WHATSAPP}?text=${encodeURIComponent(text)}`;

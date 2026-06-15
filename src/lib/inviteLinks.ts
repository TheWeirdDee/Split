export const generateInviteLink = (groupId: string): string => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://split-five-eta.vercel.app';
  return `${baseUrl}/app/join/${groupId}`;
};

export const shareViaWhatsApp = (groupName: string, link: string) => {
  const text = `Join my group "${groupName}" on Split to manage our expenses: ${link}`;
  // noopener,noreferrer prevents the opened tab from accessing window.opener (reverse tabnabbing)
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy: ', err);
    return false;
  }
};

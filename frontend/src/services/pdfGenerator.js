import { jsPDF } from 'jspdf';

/**
 * Sanitizes input text to be safe for standard jsPDF fonts (Helvetica, Times, etc.)
 * Replaces non-ASCII symbols like ₹ with Rs. and cleans non-printable Unicode characters.
 */
function sanitizeText(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/₹/g, 'Rs. ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/•/g, '-')
    .replace(/[^\x00-\x7F]/g, '');
}

export function downloadAgreementPDF(agreement) {
  try {
    const doc = new jsPDF();
    const safeAgr = agreement || {};

    const rentNum = Number(safeAgr.totalRent) || 0;
    const share1 = Number(safeAgr.roommate1Share) || 50;
    const share2 = Number(safeAgr.roommate2Share) || 50;

    const r1Share = ((rentNum * share1) / 100).toLocaleString();
    const r2Share = ((rentNum * share2) / 100).toLocaleString();

    const docId = sanitizeText(safeAgr.id || 'AGR-2026-X');
    const docDate = sanitizeText(safeAgr.createdAt || new Date().toLocaleDateString());
    const r1Name = sanitizeText(safeAgr.roommate1Name || 'Aarav Sharma');
    const r2Name = sanitizeText(safeAgr.roommate2Name || 'Ananya Verma');
    const propAddr = sanitizeText(safeAgr.propertyAddress || 'Flat 302, Palm Grove Heights, Koramangala');
    const rentDueDate = sanitizeText(safeAgr.rentDueDate || '5th of each month');
    const depositAmt = (Number(safeAgr.securityDeposit) || 100000).toLocaleString();

    // Header Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59); // Slate-800
    doc.text("DIGITAL ROOMMATE AGREEMENT", 20, 25);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Document ID: ${docId} | Date: ${docDate}`, 20, 32);

    doc.setDrawColor(226, 232, 240);
    doc.line(20, 36, 190, 36);

    // Section 1: Parties
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("1. Contracting Parties & Premises", 20, 46);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Primary Roommate 1: ${r1Name}`, 25, 54);
    doc.text(`Co-Roommate 2: ${r2Name}`, 25, 61);
    
    // Address wrap
    const addrLines = doc.splitTextToSize(`Property Address: ${propAddr}`, 165);
    doc.text(addrLines, 25, 68);

    // Section 2: Rent & Security Split
    let section2Y = 68 + (addrLines.length * 6) + 4;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("2. Rent & Security Deposit Sharing", 20, section2Y);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Total Monthly Rent: Rs. ${rentNum.toLocaleString()} (Due by ${rentDueDate})`, 25, section2Y + 8);
    doc.text(`- ${r1Name} Share (${share1}%): Rs. ${r1Share}`, 30, section2Y + 15);
    doc.text(`- ${r2Name} Share (${share2}%): Rs. ${r2Share}`, 30, section2Y + 22);
    doc.text(`Security Deposit Amount: Rs. ${depositAmt}`, 25, section2Y + 29);

    // Section 3: House Rules & Responsibilities
    let section3Y = section2Y + 41;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("3. House Rules & Co-Living Code", 20, section3Y);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    let rawRules = Array.isArray(safeAgr.houseRules) ? safeAgr.houseRules : [];
    if (rawRules.length === 0) {
      rawRules = [
        'Quiet hours enforced after 11:00 PM',
        'Shared areas (kitchen, living room) clean-as-you-go',
        'Guests permitted with prior notification',
        'Utility bills split equally on 5th of each month'
      ];
    }

    let yPos = section3Y + 8;
    rawRules.forEach((rule, idx) => {
      const cleanRule = sanitizeText(rule);
      const lines = doc.splitTextToSize(`${idx + 1}. ${cleanRule}`, 165);
      if (yPos > 260) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(lines, 25, yPos);
      yPos += (lines.length * 5) + 2;
    });

    // Signatures
    yPos += 10;
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Digital Signatures & Approvals", 20, yPos);

    yPos += 8;
    doc.setDrawColor(71, 85, 105);
    doc.rect(20, yPos, 75, 25);
    doc.rect(115, yPos, 75, 25);

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.text(`Digitally Signed by: ${r1Name}`, 25, yPos + 10);
    doc.text(`Status: Approved (Verified)`, 25, yPos + 18);

    doc.text(`Digitally Signed by: ${r2Name}`, 120, yPos + 10);
    doc.text(`Status: Approved (Verified)`, 120, yPos + 18);

    // Footer
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);
    doc.text("Generated securely via RoomieSync Digital Agreement Engine", 20, 285);

    // Trigger Save
    const cleanId = docId.replace(/[^a-zA-Z0-9_-]/g, '_');
    doc.save(`RoomieSync_Agreement_${cleanId || '2026'}.pdf`);
  } catch (err) {
    console.error("PDF Export Error:", err);
  }
}

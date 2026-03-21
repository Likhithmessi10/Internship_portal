import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const downloadNocPdf = async () => {
    const element = document.createElement('div');
    element.style.padding = '50px';
    element.style.width = '800px';
    element.style.fontFamily = 'serif';
    element.style.lineHeight = '1.6';
    element.style.color = '#000';
    element.style.backgroundColor = '#fff';

    element.innerHTML = `
        <div style="text-align: right; margin-bottom: 40px;">
            <p><strong>Ref No:</strong> ____________________</p>
            <p><strong>Date:</strong> ____________________</p>
        </div>

        <div style="margin-bottom: 30px;">
            <p>To,</p>
            <p><strong>The Chief Engineer (HRD)</strong>,</p>
            <p>APTRANSCO, Vidyut Soudha, Gunadala,</p>
            <p>Vijayawada, Andhra Pradesh - 520004.</p>
        </div>

        <div style="text-align: center; margin-bottom: 30px;">
            <p><strong>Subject: Request for Internship opportunity for a period of Six Months / Four Weeks</strong></p>
            <p>Ref: Advertisement / Notification No. ____________________</p>
        </div>

        <p>Respected Sir,</p>

        <p style="text-indent: 50px; text-align: justify; margin-bottom: 20px;">
            We request an internship opportunity for Shri/Ms. ________________________________________, who is a bonafide student of this college having enrollment no. ____________. He/She is pursuing his/her study in ______ Semester/Year of B. Tech / M. Tech / MBA / MCA of our institution and is eligible for <strong>Internship Scheme of APTRANSCO</strong>.
        </p>

        <p style="text-align: justify; margin-bottom: 20px;">
            He/She is a meritorious student and is eager to gain practical exposure in the power transmission sector through an internship at your esteemed organization.
        </p>

        <p style="text-align: justify; margin-bottom: 20px;">
            The college has no objection if he/she joins internship at your organization and is physically present in the establishment for a minimum of 15 working days in a month. The college will relieve the student to undergo the internship at your establishment.
        </p>

        <p style="text-align: justify; margin-bottom: 20px;">
            It is also hereby assured that the student will complete full tenure of his/her internship.
        </p>

        <p style="text-align: justify; margin-bottom: 30px;">
            We believe that this internship will be an excellent opportunity for our student to enhance his/her technical skills. Kindly consider this request and grant the necessary permissions. We assure you of our student's commitment to learning and adherence to all institutional norms.
        </p>

        <p>Thanks and regards,</p>

        <div style="margin-top: 60px;">
            <p><strong>Signature of Principal /</strong></p>
            <p><strong>Head of the College / Institution</strong></p>
            <p><strong>with Office Seal.</strong></p>
        </div>
    `;

    document.body.appendChild(element);
    
    try {
        const canvas = await html2canvas(element, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save('APTRANSCO_NOC_Format.pdf');
    } catch (error) {
        console.error('PDF Generation Error:', error);
    } finally {
        document.body.removeChild(element);
    }
};

import { jsPDF } from "jspdf";

export const imageToPdfBlob = async (imageFile) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                try {
                    const doc = new jsPDF('p', 'mm', 'a4');
                    const pdfWidth = doc.internal.pageSize.getWidth();
                    const pdfHeight = doc.internal.pageSize.getHeight();

                    const imgRatio = img.width / img.height;
                    
                    let printWidth = pdfWidth;
                    let printHeight = pdfWidth / imgRatio;

                    if (printHeight > pdfHeight) {
                        printHeight = pdfHeight;
                        printWidth = pdfHeight * imgRatio;
                    }

                    const x = (pdfWidth - printWidth) / 2;
                    const y = (pdfHeight - printHeight) / 2;

                    doc.addImage(img, 'JPEG', x, y, printWidth, printHeight);
                    const pdfBlob = doc.output('blob');
                    
                    const newFileName = imageFile.name.replace(/\.[^/.]+$/, ".pdf");
                    const pdfFile = new File([pdfBlob], newFileName, { type: "application/pdf" });
                    
                    resolve(pdfFile);
                } catch (err) {
                    reject(err);
                }
            };
            img.onerror = reject;
            img.src = e.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
    });
};

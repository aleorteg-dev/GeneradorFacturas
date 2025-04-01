document.getElementById("invoiceForm").addEventListener("submit", async function(e) {
    e.preventDefault();

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const cliente = document.getElementById("cliente").value;
    const concepto = document.getElementById("concepto").value;
    const precio = parseFloat(document.getElementById("precio").value).toFixed(2);
    const fecha = new Date().toLocaleDateString();
    const iva = (precio * 0.21).toFixed(2);
    const total = (parseFloat(precio) + parseFloat(iva)).toFixed(2);

    // Encabezado
    doc.setFontSize(18);
    doc.text("Factura Express Pro", 105, 20, null, null, "center");

    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Fecha: ${fecha}`, 20, 30);
    doc.text(`Cliente: ${cliente}`, 20, 40);

    // Cuadro de detalle
    doc.setFillColor(230, 230, 230);
    doc.rect(20, 55, 170, 10, "F");
    doc.setTextColor(0);
    doc.text("Descripción", 25, 62);
    doc.text("Precio (€)", 150, 62);

    doc.text(concepto, 25, 75);
    doc.text(precio.toString(), 150, 75);

    // Totales
    doc.line(20, 85, 190, 85); // línea horizontal
    doc.text(`IVA (21%): €${iva}`, 150, 95, null, null, "right");
    doc.setFontSize(13);
    doc.text(`Total: €${total}`, 150, 105, null, null, "right");

    doc.save("factura.pdf");
});

const itemsContainer = document.getElementById("itemsContainer");
const generateBtn = document.getElementById("generateBtn");
const notification = document.getElementById("notification");

function addItem(concepto = '', cantidad = 1, precio = 0) {
  const row = document.createElement("div");
  row.classList.add("item-row");
  row.innerHTML = `
    <input type="text" class="concepto" placeholder="Concepto" value="${concepto}" required />
    <input type="number" class="cantidad" placeholder="Cantidad" min="1" value="${cantidad}" required />
    <input type="number" class="precio" placeholder="Precio (€)" min="0" step="0.01" value="${precio}" required />
    <button type="button" class="remove-item" title="Eliminar producto">❌</button>
  `;
  itemsContainer.appendChild(row);
  updatePreview();
}

document.getElementById("addItem").addEventListener("click", () => addItem());

itemsContainer.addEventListener("click", (e) => {
  if (e.target.classList.contains("remove-item")) {
    e.target.parentElement.remove();
    updatePreview();
  }
});

itemsContainer.addEventListener("input", updatePreview);
document.getElementById("invoiceForm").addEventListener("input", updatePreview);

function updatePreview() {
  let subtotal = 0;
  const rows = document.querySelectorAll(".item-row");
  rows.forEach(row => {
    const cantidad = parseInt(row.querySelector(".cantidad").value) || 0;
    const precio = parseFloat(row.querySelector(".precio").value) || 0;
    subtotal += cantidad * precio;
  });
  const iva = +(subtotal * 0.21).toFixed(2);
  const total = +(subtotal + iva).toFixed(2);

  document.getElementById("previewSubtotal").textContent = subtotal.toFixed(2);
  document.getElementById("previewIVA").textContent = iva.toFixed(2);
  document.getElementById("previewTotal").textContent = total.toFixed(2);

  validarFormulario();
  saveToLocalStorage();
}

function saveToLocalStorage() {
  const data = {
    emisor: document.getElementById("emisor").value,
    nifEmisor: document.getElementById("nifEmisor").value,
    cliente: document.getElementById("cliente").value,
    nifCliente: document.getElementById("nifCliente").value,
    items: Array.from(document.querySelectorAll(".item-row")).map(row => ({
      concepto: row.querySelector(".concepto").value,
      cantidad: row.querySelector(".cantidad").value,
      precio: row.querySelector(".precio").value
    }))
  };
  localStorage.setItem("facturaDraft", JSON.stringify(data));
}

function loadFromLocalStorage() {
  const data = JSON.parse(localStorage.getItem("facturaDraft"));
  if (!data) return;
  document.getElementById("emisor").value = data.emisor || "";
  document.getElementById("nifEmisor").value = data.nifEmisor || "";
  document.getElementById("cliente").value = data.cliente || "";
  document.getElementById("nifCliente").value = data.nifCliente || "";
  data.items.forEach(item => addItem(item.concepto, item.cantidad, item.precio));
}

loadFromLocalStorage();

function validarNIFCIF(valor) {
  const regex = /^([A-Z]\d{7}[A-Z0-9]|\d{8}[A-Z])$/i;
  return regex.test(valor);
}

function marcarInput(input, valido) {
  input.classList.toggle("invalid", !valido);
}

function validarFormulario() {
  const nifEmisorInput = document.getElementById("nifEmisor");
  const nifClienteInput = document.getElementById("nifCliente");

  const esNifEmisorValido = validarNIFCIF(nifEmisorInput.value.trim());
  const esNifClienteValido = nifClienteInput.value.trim() === "" || validarNIFCIF(nifClienteInput.value.trim());

  marcarInput(nifEmisorInput, esNifEmisorValido);
  marcarInput(nifClienteInput, esNifClienteValido);

  const hayProductos = document.querySelectorAll(".item-row").length > 0;

  generateBtn.disabled = !esNifEmisorValido || !hayProductos;
}

document.getElementById("invoiceForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const emisor = document.getElementById("emisor").value;
  const nifEmisor = document.getElementById("nifEmisor").value;
  const cliente = document.getElementById("cliente").value;
  const nifCliente = document.getElementById("nifCliente").value;
  const fecha = new Date().toLocaleDateString();

  const count = parseInt(localStorage.getItem("facturaCount") || "0") + 1;
  localStorage.setItem("facturaCount", count);
  const numeroFactura = `F-${new Date().getFullYear()}-${String(count).padStart(5, "0")}`;

  const logoInput = document.getElementById("logo");
  const file = logoInput.files[0];

  const generatePDF = (logoData = null) => {
    let yOffset = logoData ? 35 : 20;

    if (logoData) doc.addImage(logoData, "PNG", 20, 10, 50, 20);

    doc.setFontSize(18);
    doc.text("Factura", 105, yOffset, null, null, "center");
    yOffset += 10;
    doc.setFontSize(11);
    doc.text(`Fecha: ${fecha}`, 20, yOffset); yOffset += 7;
    doc.text(`N.º Factura: ${numeroFactura}`, 150, yOffset); yOffset += 10;
    doc.setFontSize(12);
    doc.text(`Emisor: ${emisor}`, 20, yOffset); yOffset += 7;
    doc.text(`NIF: ${nifEmisor}`, 20, yOffset); yOffset += 8;
    doc.text(`Cliente: ${cliente}`, 20, yOffset); yOffset += 7;
    doc.text(`NIF: ${nifCliente}`, 20, yOffset);

    const items = [];
    let subtotal = 0;
    document.querySelectorAll(".item-row").forEach(row => {
      const concepto = row.querySelector(".concepto").value;
      const cantidad = parseInt(row.querySelector(".cantidad").value);
      const precio = parseFloat(row.querySelector(".precio").value);
      const total = cantidad * precio;
      subtotal += total;
      items.push([concepto, cantidad, `€${precio.toFixed(2)}`, `€${total.toFixed(2)}`]);
    });

    const iva = +(subtotal * 0.21).toFixed(2);
    const totalFinal = +(subtotal + iva).toFixed(2);

    doc.autoTable({
      startY: yOffset + 10,
      head: [['Descripción', 'Cantidad', 'Precio Unitario', 'Subtotal']],
      body: items,
      styles: { fontSize: 10 }
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`IVA (21%): €${iva}`, 190, finalY, { align: 'right' });
    doc.setFontSize(14);
    doc.text(`Total: €${totalFinal}`, 190, finalY + 10, { align: 'right' });

    doc.save(`factura-${numeroFactura}.pdf`);
    notification.classList.remove("hidden");
    setTimeout(() => {
      notification.classList.add("fade-out");
      setTimeout(() => notification.classList.add("hidden"), 500);
    }, 3000);

    document.getElementById("invoiceForm").reset();
    itemsContainer.innerHTML = '';
    addItem();
  };

  if (file) {
    const reader = new FileReader();
    reader.onload = e => generatePDF(e.target.result);
    reader.readAsDataURL(file);
  } else {
    generatePDF();
  }
});

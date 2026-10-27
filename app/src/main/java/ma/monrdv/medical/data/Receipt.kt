package ma.monrdv.medical.data

import android.content.Context
import android.graphics.Paint
import android.graphics.pdf.PdfDocument
import android.os.Environment
import java.io.File

/** Génère un reçu PDF simple et retourne le chemin du fichier. */
fun saveReceiptPdf(context: Context, appt: Appointment): String {
    val doc = PdfDocument()
    val page = doc.startPage(PdfDocument.PageInfo.Builder(595, 842, 1).create())
    val canvas = page.canvas

    val titlePaint = Paint().apply {
        textSize = 22f
        isFakeBoldText = true
        color = android.graphics.Color.rgb(0, 159, 227)
    }
    val textPaint = Paint().apply { textSize = 14f }

    var y = 80f
    canvas.drawText("Mon RDV Médical - Reçu", 50f, y, titlePaint)
    y += 40f
    listOf(
        "Référence : ${appt.id}",
        "Médecin / Cabinet : ${appt.provider.name}",
        "Spécialité : ${appt.provider.specialty}",
        "Adresse : ${appt.provider.address}, ${appt.provider.city}",
        "Date : ${appt.dateTime.frLabel()}",
        "Motif : ${appt.reason}",
        "Montant payé : ${appt.amount} MAD"
    ).forEach {
        canvas.drawText(it, 50f, y, textPaint)
        y += 28f
    }
    doc.finishPage(page)

    val dir = context.getExternalFilesDir(Environment.DIRECTORY_DOCUMENTS) ?: context.filesDir
    val file = File(dir, "recu_${appt.id}.pdf")
    file.outputStream().use { doc.writeTo(it) }
    doc.close()
    return file.absolutePath
}

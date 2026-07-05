export function pripravTisk(htmlObsah, nazevDokumentu = 'Tisk') {
    // Vytvoření nového okna pro tisk
    var tiskoveOkno = window.open('', '_blank', 'width=800,height=600');
    
    // Základní HTML struktura pro tisk
    tiskoveOkno.document.write('<!DOCTYPE html>');
    tiskoveOkno.document.write('<html>');
    tiskoveOkno.document.write('<head>');
    tiskoveOkno.document.write('<meta charset="UTF-8">');
    tiskoveOkno.document.write('<title>' + (nazevDokumentu || 'Tisk') + '</title>');
    tiskoveOkno.document.write('<style>');
    tiskoveOkno.document.write('body { font-family: Arial, sans-serif; margin: 20px; }');
    tiskoveOkno.document.write('@media print { body { margin: 0; } }');
    tiskoveOkno.document.write('</style>');
    tiskoveOkno.document.write('</head>');
    tiskoveOkno.document.write('<body>');
    tiskoveOkno.document.write(htmlObsah);
    tiskoveOkno.document.write('</body>');
    tiskoveOkno.document.write('</html>');
    
    tiskoveOkno.document.close();
    
    // Automatický tisk po načtení
    tiskoveOkno.onload = function() {
        tiskoveOkno.print();
        tiskoveOkno.close();
    };
}
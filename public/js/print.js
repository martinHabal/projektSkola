 // Aktualizuje podpis v tiskové verzi
 "use strict"
                function updatePrintSignature() {
                    const userName = document.getElementById('user-name').value || loadUserName();
                    document.getElementById('print-user-name').textContent = `Podpis: ${userName}`;
                }
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('listing-form');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Envoi en cours...';
        
        try {
            const formData = new FormData(form);
            
            const response = await fetch('/add-listing', {
                method: 'POST',
                body: formData
            });

            if (response.redirected) {
                window.location.href = response.url;
            } else {
                const result = await response.json();
                if (result.error) {
                    throw new Error(result.error);
                }
                alert('Annonce créée avec succès !');
                window.location.href = '/';
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert(`Erreur: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Publier l\'annonce';
        }
    });
});
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('edit-form');
    const photoInput = document.getElementById('photos');
    const previewContainer = document.getElementById('preview-container');

    photoInput.addEventListener('change', function() {
        previewContainer.innerHTML = '';
        if (this.files) {
            Array.from(this.files).forEach(file => {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    previewContainer.appendChild(img);
                }
                reader.readAsDataURL(file);
            });
        }
    });

    // Gestion de la soumission
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Enregistrement...';
        
        try {
            const formData = new FormData(form);
            
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData
            });

            if (response.redirected) {
                window.location.href = response.url;
            } else {
                const result = await response.json();
                if (result.error) throw new Error(result.error);
                alert('Modifications enregistrées !');
                window.location.href = `/logement/${form.action.split('/').pop()}`;
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert(`Erreur: ${error.message}`);
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Enregistrer les modifications';
        }
    });
});
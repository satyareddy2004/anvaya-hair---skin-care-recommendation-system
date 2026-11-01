function analyzeImage(filename, category) {
  // Simulate AI analysis
  return new Promise((resolve) => {
      setTimeout(() => {
          const userId = localStorage.getItem('userId') || 'guest';
          fetch('/analysis/save', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              body: JSON.stringify({ userId, filename, category })
          })
          .then(response => response.json())
          .then(data => {
              if (data.success) {
                  resolve({ success: true, analysisId: data.analysisId });
              } else {
                  resolve({ success: false, error: 'Analysis save failed' });
              }
          })
          .catch(error => {
              resolve({ success: false, error: error.message });
          });
      }, 1000);
  });
}
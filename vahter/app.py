from flask import Flask, render_template, request, redirect, url_for
from prometheus_flask_exporter import PrometheusMetrics
from prometheus_client import Counter, Histogram
import time
import os

app = Flask(__name__)

# Metrics
metrics = PrometheusMetrics(app)
metrics.info('app_info', 'Application info', version='1.0.0')

# Custom metrics
records_total = Counter('vahter_records_total', 'Total number of registered check-ins', ['status'])
request_latency = Histogram('flask_http_request_duration_seconds', 'Request latency', ['method', 'endpoint'])

# In-memory database
records = []

@app.route('/', methods=['GET'])
def index():
    return render_template('index.html', records=records)

@app.route('/', methods=['POST'])
@request_latency.labels(method='POST', endpoint='/').time()
def check_in():
    name = request.form.get('name', '').strip()
    role = request.form.get('role', '').strip()
    note = request.form.get('note', '').strip()

    if not name or not role:
        records_total.labels(status='failed').inc()
        return "Name and Role are required", 400

    timestamp = time.strftime('%Y-%m-%d %H:%M:%S')
    record = {
        'name': name,
        'role': role,
        'note': note,
        'timestamp': timestamp
    }
    
    # Prepend to show newest first
    records.insert(0, record)
    records_total.labels(status='success').inc()
    
    return redirect(url_for('index'))

@app.route('/health')
def health():
    return "OK", 200

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    app.run(host='0.0.0.0', port=port)

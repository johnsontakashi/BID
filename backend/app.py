from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import json
import os
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)

EXCEL_FILE_PATH = 'workana_projects.xlsx'

def ensure_excel_file():
    if not os.path.exists(EXCEL_FILE_PATH):
        df = pd.DataFrame(columns=[
            'ID', 'Title', 'Description', 'Link', 'Budget', 
            'Tags', 'Posted_Time', 'Scraped_At', 'Source', 'Pin_Index', 'Item_Index'
        ])
        df.to_excel(EXCEL_FILE_PATH, index=False, engine='openpyxl')
    return EXCEL_FILE_PATH

def load_projects_from_excel():
    try:
        if os.path.exists(EXCEL_FILE_PATH):
            df = pd.read_excel(EXCEL_FILE_PATH, engine='openpyxl')
            return df.to_dict('records')
        return []
    except Exception as e:
        print(f"Error loading Excel file: {e}")
        return []

def save_project_to_excel(project_data):
    try:
        ensure_excel_file()
        
        existing_df = pd.read_excel(EXCEL_FILE_PATH, engine='openpyxl') if os.path.exists(EXCEL_FILE_PATH) else pd.DataFrame()
        
        if not existing_df.empty and project_data['id'] in existing_df['ID'].values:
            print(f"Project {project_data['id']} already exists in Excel file")
            return False
        
        new_row = {
            'ID': project_data['id'],
            'Title': project_data['title'],
            'Description': project_data['description'][:500],
            'Link': project_data['link'],
            'Budget': project_data.get('budget', ''),
            'Tags': ', '.join(project_data.get('tags', [])) if project_data.get('tags') else '',
            'Posted_Time': project_data.get('postedTime', ''),
            'Scraped_At': project_data.get('scrapedAt', datetime.now().isoformat()),
            'Source': project_data.get('source', 'workana'),
            'Pin_Index': project_data.get('pinIndex', ''),
            'Item_Index': project_data.get('itemIndex', '')
        }
        
        new_df = pd.DataFrame([new_row])
        
        if not existing_df.empty:
            combined_df = pd.concat([existing_df, new_df], ignore_index=True)
        else:
            combined_df = new_df
        
        combined_df.to_excel(EXCEL_FILE_PATH, index=False, engine='openpyxl')
        print(f"Project '{project_data['title']}' saved to Excel successfully")
        return True
        
    except Exception as e:
        print(f"Error saving to Excel: {e}")
        return False

@app.route('/api/projects', methods=['POST'])
def receive_project():
    try:
        project_data = request.get_json()
        
        if not project_data:
            return jsonify({'error': 'No data provided'}), 400
        
        required_fields = ['id', 'title', 'link']
        missing_fields = [field for field in required_fields if field not in project_data]
        
        if missing_fields:
            return jsonify({'error': f'Missing required fields: {missing_fields}'}), 400
        
        success = save_project_to_excel(project_data)
        
        if success:
            return jsonify({
                'message': 'Project saved successfully',
                'project_id': project_data['id']
            }), 201
        else:
            return jsonify({'message': 'Project already exists'}), 200
            
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/projects', methods=['GET'])
def get_projects():
    try:
        projects = load_projects_from_excel()
        
        limit = request.args.get('limit', type=int)
        if limit:
            projects = projects[:limit]
            
        return jsonify({
            'projects': projects,
            'total': len(projects)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/projects/<project_id>', methods=['GET'])
def get_project(project_id):
    try:
        projects = load_projects_from_excel()
        project = next((p for p in projects if str(p.get('ID')) == str(project_id)), None)
        
        if project:
            return jsonify(project), 200
        else:
            return jsonify({'error': 'Project not found'}), 404
            
    except Exception as e:
        return jsonify({'error': f'Server error: {str(e)}'}), 500

@app.route('/api/export/excel', methods=['GET'])
def export_excel():
    try:
        if not os.path.exists(EXCEL_FILE_PATH):
            return jsonify({'error': 'No data to export'}), 404
            
        return jsonify({
            'message': 'Excel file ready for download',
            'file_path': EXCEL_FILE_PATH,
            'download_url': f'/api/download/excel'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Export error: {str(e)}'}), 500

@app.route('/api/download/excel', methods=['GET'])
def download_excel():
    try:
        if os.path.exists(EXCEL_FILE_PATH):
            return send_file(
                EXCEL_FILE_PATH,
                as_attachment=True,
                download_name=f'workana_projects_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx',
                mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
        else:
            return jsonify({'error': 'Excel file not found'}), 404
    except Exception as e:
        return jsonify({'error': f'Download error: {str(e)}'}), 500

@app.route('/api/stats', methods=['GET'])
def get_stats():
    try:
        projects = load_projects_from_excel()
        
        total_projects = len(projects)
        today_projects = 0
        
        today = datetime.now().date()
        
        for project in projects:
            try:
                scraped_date = datetime.fromisoformat(project.get('Scraped_At', '')).date()
                if scraped_date == today:
                    today_projects += 1
            except:
                continue
        
        return jsonify({
            'total_projects': total_projects,
            'today_projects': today_projects,
            'excel_file_exists': os.path.exists(EXCEL_FILE_PATH)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Stats error: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'excel_file_status': 'exists' if os.path.exists(EXCEL_FILE_PATH) else 'not_found'
    }), 200

if __name__ == '__main__':
    ensure_excel_file()
    print(f"Starting Workana Monitor Backend...")
    print(f"Excel file will be saved as: {os.path.abspath(EXCEL_FILE_PATH)}")
    print(f"API endpoints:")
    print(f"  POST /api/projects - Save new project")
    print(f"  GET /api/projects - Get all projects")
    print(f"  GET /api/export/excel - Export to Excel")
    print(f"  GET /api/stats - Get statistics")
    print(f"  GET /api/health - Health check")
    
    app.run(debug=True, host='localhost', port=5001)
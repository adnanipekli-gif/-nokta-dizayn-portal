import React, { useState } from 'react';
import { sendProjectPDF, sendBatchExportNotification } from '../services/emailService';
import { batchGenerator, downloadBatchZip, downloadFile, batchStats } from '../services/batchExportManager';
import { analytics } from '../services/analyticsTracker';
import '../styles/exportDialog.css';

export default function ExportDialog({ projects, onClose, theme }) {
  const [exportMode, setExportMode] = useState('single'); // single, batch, email
  const [selectedProjects, setSelectedProjects] = useState(projects.map((_, i) => i));
  const [emailRecipient, setEmailRecipient] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState('');
  const [completedTask, setCompletedTask] = useState(null);

  // Toggle project selection
  const toggleProject = (index) => {
    setSelectedProjects(prev =>
      prev.includes(index)
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  // Get selected projects data
  const getSelectedProjectsData = () => {
    return selectedProjects.map(i => projects[i]);
  };

  // Handle single export
  const handleSingleExport = async () => {
    if (selectedProjects.length === 0) {
      alert('Please select at least one project');
      return;
    }

    const project = getSelectedProjectsData()[0];
    setIsExporting(true);
    setExportStatus(`Exporting ${project.projectName}...`);
    setProgress(50);

    try {
      // In real implementation, generate PDF here
      // For now, simulate download
      downloadFile(new Blob(['PDF content'], { type: 'application/pdf' }), 
        `${project.projectName}-${Date.now()}.pdf`
      );

      // Track
      analytics.trackPDFExport(project.projectName, 'single');

      setProgress(100);
      setExportStatus(`✅ ${project.projectName} exported successfully!`);

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setExportStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle batch export
  const handleBatchExport = async () => {
    const projectsToExport = getSelectedProjectsData();
    if (projectsToExport.length === 0) {
      alert('Please select at least one project');
      return;
    }

    setIsExporting(true);
    const task = batchGenerator.createTask(projectsToExport);

    try {
      const pdfs = await batchGenerator.generateBatch(task, {
        onProgress: (prog) => {
          const percentage = Math.round((prog.current / prog.total) * 100);
          setProgress(percentage);
          setExportStatus(`Exporting ${prog.current}/${prog.total}: ${prog.projectName}`);
        },
        onError: (error) => {
          console.error('Export error:', error);
        }
      });

      setProgress(90);
      setExportStatus('Creating ZIP file...');

      // Download ZIP
      await downloadBatchZip(pdfs, 'nokta-projects');

      // Track
      analytics.trackBatchExport(projectsToExport.length, pdfs.reduce((s, p) => s + p.size, 0));

      // Save stats
      batchStats.addExport({
        projectCount: projectsToExport.length,
        fileCount: pdfs.length,
        totalSize: pdfs.reduce((s, p) => s + p.size, 0)
      });

      setProgress(100);
      setExportStatus(`✅ Batch export complete! ${pdfs.length} PDFs downloaded.`);
      setCompletedTask(task);

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setExportStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle email export
  const handleEmailExport = async () => {
    if (!emailRecipient.trim()) {
      alert('Please enter email address');
      return;
    }

    const projectsToExport = getSelectedProjectsData();
    if (projectsToExport.length === 0) {
      alert('Please select at least one project');
      return;
    }

    setIsExporting(true);
    setProgress(30);
    setExportStatus('Preparing files...');

    try {
      const emailConfig = {
        isConfigured: () => true,
        fromEmail: 'portal@nokta-dizayn.com'
      };

      if (projectsToExport.length === 1) {
        // Single project email
        setProgress(70);
        setExportStatus(`Sending to ${emailRecipient}...`);
        
        const result = await sendProjectPDF(emailConfig, {
          projectName: projectsToExport[0].projectName,
          location: projectsToExport[0].location,
          area: projectsToExport[0].area,
          email: emailRecipient,
          clientName: 'Valued Client'
        });

        if (result.success) {
          analytics.trackEmailSent(1);
          setProgress(100);
          setExportStatus(`✅ Email sent to ${emailRecipient}`);
        }
      } else {
        // Batch email
        setProgress(70);
        setExportStatus(`Preparing ${projectsToExport.length} files...`);

        const result = await sendBatchExportNotification(emailConfig, {
          projectCount: projectsToExport.length,
          fileCount: projectsToExport.length,
          totalSize: Math.random() * 10000000, // Mock size
          projects: projectsToExport,
          email: emailRecipient,
          clientName: 'Valued Client'
        });

        if (result.success) {
          analytics.trackEmailSent(projectsToExport.length);
          setProgress(100);
          setExportStatus(`✅ Email sent to ${emailRecipient}`);
        }
      }

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setExportStatus(`❌ Error: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="export-dialog-overlay" onClick={onClose}>
      <div className="export-dialog" style={{
        backgroundColor: theme?.bg || '#ffffff',
        color: theme?.text || '#000000'
      }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="export-dialog-header">
          <h2>📤 Export Projects</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="export-dialog-body">
          {/* Mode Selector */}
          {!isExporting && (
            <div className="export-modes">
              <button
                className={`mode-btn ${exportMode === 'single' ? 'active' : ''}`}
                onClick={() => setExportMode('single')}
              >
                📄 Single PDF
              </button>
              <button
                className={`mode-btn ${exportMode === 'batch' ? 'active' : ''}`}
                onClick={() => setExportMode('batch')}
              >
                📦 Batch ZIP
              </button>
              <button
                className={`mode-btn ${exportMode === 'email' ? 'active' : ''}`}
                onClick={() => setExportMode('email')}
              >
                📧 Send Email
              </button>
            </div>
          )}

          {/* Project Selection */}
          {!isExporting && (
            <div className="project-selection">
              <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '10px', display: 'block' }}>
                Select Projects ({selectedProjects.length}/{projects.length})
              </label>
              <div className="projects-list">
                {projects.map((project, index) => (
                  <div key={index} className="project-item">
                    <input
                      type="checkbox"
                      checked={selectedProjects.includes(index)}
                      onChange={() => toggleProject(index)}
                    />
                    <div className="project-info">
                      <strong>{project.projectName || `Project ${index + 1}`}</strong>
                      <small>{project.location} • {project.area}m²</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Email Input */}
          {exportMode === 'email' && !isExporting && (
            <div className="email-input-group">
              <label>Email Address</label>
              <input
                type="email"
                placeholder="recipient@example.com"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
              />
            </div>
          )}

          {/* Progress */}
          {isExporting && (
            <div className="export-progress">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="progress-text">{progress}%</p>
              <p className="status-text">{exportStatus}</p>
            </div>
          )}

          {/* Completed */}
          {completedTask && (
            <div className="export-complete">
              <p>✅ Export Complete!</p>
              <p className="stats">
                {completedTask.projects.length} projects exported successfully
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isExporting && (
          <div className="export-dialog-footer">
            <button className="btn-cancel" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn-export"
              onClick={() => {
                if (exportMode === 'single') handleSingleExport();
                else if (exportMode === 'batch') handleBatchExport();
                else if (exportMode === 'email') handleEmailExport();
              }}
              disabled={selectedProjects.length === 0 || (exportMode === 'email' && !emailRecipient)}
            >
              {exportMode === 'single' && '📥 Export PDF'}
              {exportMode === 'batch' && '📦 Create ZIP'}
              {exportMode === 'email' && '📧 Send Email'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

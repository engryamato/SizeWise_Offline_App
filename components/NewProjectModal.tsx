'use client';
import { useState, useEffect } from 'react';
import { createProject, canCreateProject, FreeTierLimitError } from '../db/dao';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (projectId: string) => void;
}

export default function NewProjectModal({ isOpen, onClose, onProjectCreated }: NewProjectModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'residential' as 'residential' | 'commercial' | 'industrial',
    description: '',
    unitSystem: 'imperial' as 'imperial' | 'si'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [limitInfo, setLimitInfo] = useState<{allowed: boolean; reason?: string; current: number; limit: number} | null>(null);

  // Check limits when modal opens
  useEffect(() => {
    if (isOpen) {
      canCreateProject().then(setLimitInfo).catch(() => {});
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const projectId = await createProject(
        formData.name.trim(),
        formData.unitSystem,
        formData.category,
        formData.description.trim()
      );
      
      onProjectCreated(projectId);
      onClose();
      
      // Reset form
      setFormData({
        name: '',
        category: 'residential',
        description: '',
        unitSystem: 'imperial'
      });
    } catch (err) {
      if (err instanceof FreeTierLimitError) {
        setError(err.message);
      } else {
        setError('Failed to create project. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      setError(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Project</h2>
          <button className="modal-close" onClick={handleClose} disabled={isSubmitting}>×</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="project-name">Project Name *</label>
            <input
              id="project-name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter project name"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="project-category">Category</label>
            <select
              id="project-category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as any }))}
              disabled={isSubmitting}
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="project-description">Description</label>
            <textarea
              id="project-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Optional project description"
              disabled={isSubmitting}
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="unit-system">Unit System</label>
            <select
              id="unit-system"
              value={formData.unitSystem}
              onChange={(e) => setFormData(prev => ({ ...prev, unitSystem: e.target.value as any }))}
              disabled={isSubmitting}
            >
              <option value="imperial">Imperial (ft, in, cfm)</option>
              <option value="si">SI (m, mm, m³/s)</option>
            </select>
          </div>

          {limitInfo && !limitInfo.allowed && (
            <div className="limit-warning">
              <strong>Free Tier Limit Reached</strong>
              <div>{limitInfo.reason}</div>
              <div className="muted">Current: {limitInfo.current}/{limitInfo.limit}</div>
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (limitInfo?.allowed === false)}
              className="btn-primary"
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

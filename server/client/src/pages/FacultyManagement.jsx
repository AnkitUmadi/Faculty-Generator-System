import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Select from 'react-select';
import { SUBJECT_GROUPS } from '../constants/subjects';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

const FacultyManagement = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [settings, setSettings] = useState(null);
  const [periods, setPeriods] = useState([1, 2, 3, 4, 5]);
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    department: '',
    availability: []
  });
  const [editingId, setEditingId] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSubjects();
    fetchFaculty();
    fetchSettings();
  }, []);

  /* ✅ NEW: FETCH SETTINGS TO GET NUMBER OF PERIODS */
  const fetchSettings = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/settings');
      const data = await response.json();
      if (data.success) {
        setSettings(data.data);
        const numPeriods = data.data.numberOfPeriods || 5;
        setPeriods(Array.from({ length: numPeriods }, (_, i) => i + 1));
        console.log(`✅ Loaded ${numPeriods} periods from settings`);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Fallback to 5 periods if settings fetch fails
      setPeriods([1, 2, 3, 4, 5]);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/subjects');
      const data = await response.json();
      if (data.success) {
        setSubjects(data.data);
        console.log('✅ Loaded subjects from DB:', data.data.map(s => `${s.code}`).join(', '));
      }
    } catch (error) {
      console.error('❌ Error fetching subjects:', error);
      alert('Failed to load subjects. Please check your connection.');
    }
  };

  const fetchFaculty = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/faculty');
      const data = await response.json();
      if (data.success) {
        setFacultyList(data.data);
        console.log('✅ Loaded faculty:', data.data.length);
      }
    } catch (error) {
      console.error('Error fetching faculty:', error);
    }
  };

  const handleSubjectChange = (selected) => {
    if (!selected) {
      setFormData({ ...formData, subject: '', department: '' });
      return;
    }

    const subjectCode = selected.value;
    const selectedSubject = subjects.find(s => s.code === subjectCode);
    
    if (!selectedSubject) {
      console.warn(`⚠️ Subject with code "${subjectCode}" not found in database`);
      alert(`Subject "${subjectCode}" not found in database. Please run the seed script first.`);
      return;
    }
    
    setFormData({
      ...formData,
      subject: subjectCode,
      department: selectedSubject.department._id
    });

    console.log('✅ Selected subject:', subjectCode, '| Department:', selectedSubject.department.name);
  };

  const handleSlotClick = (day, period) => {
    const key = `${day}-${period}`;
    setSelectedSlots(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const convertSlotsToAvailability = () => {
  const availability = [];
  
  DAYS.forEach(day => {
    const dayPeriods = [];

    periods.forEach(period => {
      const key = `${day}-${period}`;
      if (selectedSlots[key]) {
        dayPeriods.push(period);
      }
    });
    
    if (dayPeriods.length > 0) {
      availability.push({ day, periods: dayPeriods });
    }
  });
  
  return availability;
};


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.name.trim()) {
      alert('❌ Please enter faculty name');
      return;
    }

    if (!formData.subject) {
      alert('❌ Please select a subject');
      return;
    }

    const availability = convertSlotsToAvailability();
    
    if (availability.length === 0) {
      alert('❌ Please select at least one availability slot');
      return;
    }

    // Find the selected subject in DB
    const selectedSubject = subjects.find(s => s.code === formData.subject);
    
    if (!selectedSubject) {
      alert(`❌ Subject "${formData.subject}" not found in database.\n\nAvailable subjects: ${subjects.map(s => s.code).join(', ')}\n\nPlease run the seed script.`);
      return;
    }

    // ✅ CRITICAL FIX: Backend expects subjectCode for BOTH add and update
    const payload = {
      name: formData.name,
      subjectCode: formData.subject,  // ✅ Send CODE, not ObjectId
      availability
    };

    console.log('📤 Sending payload:', payload);
    console.log('📤 Availability:', JSON.stringify(availability, null, 2));

    setLoading(true);

    try {
      const url = editingId 
        ? `http://localhost:5000/api/faculty/${editingId}`
        : 'http://localhost:5000/api/faculty';
      
      const method = editingId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(editingId ? '✅ Faculty updated successfully!' : '✅ Faculty added successfully!');
        await fetchFaculty();
        resetForm();
      } else {
        alert('❌ Error: ' + (data.message || 'Operation failed'));
        console.error('Backend error:', data);
      }
    } catch (error) {
      console.error('❌ Error saving faculty:', error);
      alert('Server error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (faculty) => {
    console.log('📝 Editing faculty:', faculty);

    setEditingId(faculty._id);
    
    const subjectCode = faculty.subject?.code || '';
    
    setFormData({
      name: faculty.name,
      subject: subjectCode,
      department: faculty.subject?.department?._id || '',
      availability: faculty.availability
    });
    
    // ✅ CRITICAL: Restore selected slots from availability
    const slots = {};
    if (faculty.availability && Array.isArray(faculty.availability)) {
      faculty.availability.forEach(avail => {
        if (avail.periods && Array.isArray(avail.periods)) {
          avail.periods.forEach(period => {
            slots[`${avail.day}-${period}`] = true;
          });
        }
      });
    }
    
    console.log('✅ Restored slots:', slots);
    setSelectedSlots(slots);

    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this faculty member?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/faculty/${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ Faculty deleted successfully!');
        fetchFaculty();
      } else {
        alert('❌ Error: ' + (data.message || 'Delete failed'));
      }
    } catch (error) {
      console.error('Error deleting faculty:', error);
      alert('Server error: ' + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      subject: '',
      department: '',
      availability: []
    });
    setSelectedSlots({});
    setEditingId(null);
  };

  const getSelectedSubjectDepartment = () => {
    const selectedSubject = subjects.find(s => s.code === formData.subject);
    return selectedSubject ? selectedSubject.department.name : '';
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Header />
      
      <div style={{ padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ 
          fontSize: '32px', 
          marginBottom: '40px',
          color: '#333'
        }}>
          Faculty Management
        </h1>

        {/* ✅ SHOW SETTINGS INFO */}
        {settings && (
          <div style={{
            backgroundColor: '#e7f3ff',
            border: '1px solid #b3d9ff',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            fontSize: '14px',
            color: '#004085'
          }}>
            <strong>📊 Current Settings:</strong> {periods.length} periods configured 
            ({settings.workingHours.startTime} - {settings.workingHours.endTime}, 
            {settings.periodDuration} min per period)
          </div>
        )}

        <div style={{
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          marginBottom: '32px'
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#333' }}>
            {editingId ? '✏️ Edit Faculty' : '➕ Add Faculty'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#555', fontWeight: '500' }}>
                  Faculty Name *
                </label>
                <input
                  type="text"
                  placeholder="Enter faculty name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#555', fontWeight: '500' }}>
                  Subject *
                </label>
                <Select
                  options={SUBJECT_GROUPS}
                  placeholder="Select Subject"
                  isSearchable
                  value={
                    SUBJECT_GROUPS
                      .flatMap(group => group.options)
                      .find(opt => opt.value === formData.subject) || null
                  }
                  onChange={handleSubjectChange}
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '42px',
                      fontSize: '14px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                    }),
                    menuList: (base) => ({
                      ...base,
                      maxHeight: '220px',
                      overflowY: 'auto',
                    }),
                  }}
                />
              </div>

              <div style={{ flex: '1', minWidth: '200px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: '#555', fontWeight: '500' }}>
                  Department
                </label>
                <input
                  type="text"
                  value={getSelectedSubjectDepartment()}
                  readOnly
                  placeholder="Auto-filled from subject"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px',
                    backgroundColor: '#f9f9f9',
                    color: '#666'
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontSize: '14px', color: '#555', fontWeight: '600' }}>
                Availability (Click to select periods) *
              </label>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  border: '1px solid #ddd'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                      <th style={{ 
                        padding: '12px', 
                        border: '1px solid #ddd',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#555'
                      }}>
                        Day
                      </th>
                      {periods.map(period => (
                        <th key={period} style={{ 
                          padding: '12px', 
                          border: '1px solid #ddd',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: '#555',
                          textAlign: 'center'
                        }}>
                          P{period}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map(day => (
                      <tr key={day}>
                        <td style={{ 
                          padding: '12px', 
                          border: '1px solid #ddd',
                          fontSize: '14px',
                          fontWeight: '500',
                          backgroundColor: '#f8f9fa'
                        }}>
                          {day}
                        </td>
                        {periods.map(period => {
                          const key = `${day}-${period}`;
                          const isSelected = selectedSlots[key];
                          return (
                            <td 
                              key={period}
                              onClick={() => handleSlotClick(day, period)}
                              style={{ 
                                padding: '12px', 
                                border: '1px solid #ddd',
                                textAlign: 'center',
                                cursor: 'pointer',
                                backgroundColor: isSelected ? '#007bff' : '#fff',
                                color: isSelected ? '#fff' : '#333',
                                transition: 'background-color 0.2s',
                                userSelect: 'none'
                              }}
                            >
                              {isSelected ? '✓' : ''}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  backgroundColor: loading ? '#ccc' : '#28a745',
                  color: '#fff',
                  border: 'none',
                  padding: '10px 24px',
                  borderRadius: '4px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Saving...' : editingId ? 'Update Faculty' : 'Add Faculty'}
              </button>
              
              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  style={{
                    backgroundColor: '#6c757d',
                    color: '#fff',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div style={{
          backgroundColor: '#fff',
          padding: '24px',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px', color: '#333' }}>
            Faculty List
          </h2>
          
          {facultyList.length === 0 ? (
            <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
              No faculty members added yet. Add your first faculty member above!
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e0e0e0' }}>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '12px', 
                      fontSize: '14px', 
                      fontWeight: '600',
                      color: '#555'
                    }}>
                      Name
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '12px', 
                      fontSize: '14px', 
                      fontWeight: '600',
                      color: '#555'
                    }}>
                      Subject
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '12px', 
                      fontSize: '14px', 
                      fontWeight: '600',
                      color: '#555'
                    }}>
                      Department
                    </th>
                    <th style={{ 
                      textAlign: 'left', 
                      padding: '12px', 
                      fontSize: '14px', 
                      fontWeight: '600',
                      color: '#555'
                    }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {facultyList.map((faculty) => (
                    <tr key={faculty._id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>
                        {faculty.name}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>
                        {faculty.subject?.name || 'N/A'}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#333' }}>
                        {faculty.subject?.department?.name || 'N/A'}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <button
                          onClick={() => handleEdit(faculty)}
                          style={{
                            backgroundColor: '#007bff',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 16px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            cursor: 'pointer',
                            marginRight: '8px'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(faculty._id)}
                          style={{
                            backgroundColor: '#dc3545',
                            color: '#fff',
                            border: 'none',
                            padding: '6px 16px',
                            borderRadius: '4px',
                            fontSize: '13px',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ✅ DEBUG INFO */}
        {subjects.length > 0 && (
          <div style={{
            marginTop: '20px',
            padding: '12px',
            backgroundColor: '#e7f3ff',
            borderRadius: '4px',
            fontSize: '12px',
            color: '#004085'
          }}>
            <strong>📊 Database Status:</strong> {subjects.length} subjects loaded ({subjects.map(s => s.code).join(', ')})
          </div>
        )}
      </div>
    </div>
  );
};

export default FacultyManagement;
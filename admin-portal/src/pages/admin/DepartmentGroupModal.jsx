import React, { useState } from 'react';
import { X } from 'lucide-react';
import Select from '../../components/ui/Select';

const InputField = ({ label, required, hint, children }) => (
    <div className="space-y-1.5">
        <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-outline mb-1 flex items-center gap-2">
            {label} {required && <span className="text-error">*</span>}
        </label>
        {children}
        {hint && <p className="text-[9px] text-outline/70 font-bold uppercase tracking-tighter mt-1">{hint}</p>}
    </div>
);

const DepartmentGroupModal = ({ isOpen, onClose, onSave, departments, internshipType }) => {
    const [group, setGroup] = useState({
        department: '',
        title: '',
        openings: '',
        rolesData: [],
        fields: [],
        skillsRequired: '',
        expectations: '',
        customQuestions: [],
        preferredColleges: [],
        quotaPercentages: { preferred: 20, premier: 30, normal: 50 }
    });

    const [roleInput, setRoleInput] = useState({ name: '', openings: 1 });
    const [fieldInput, setFieldInput] = useState({ fieldName: '', description: '', vacancies: '', locations: [] });
    const [locationInput, setLocationInput] = useState('');
    const [questionInput, setQuestionInput] = useState('');
    const [collegeInput, setCollegeInput] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-xl w-full max-w-4xl shadow-2xl overflow-hidden my-8">
                <div className="p-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
                    <div>
                        <h2 className="text-xl font-bold text-primary">Add Department Group</h2>
                        <p className="text-xs text-outline font-medium uppercase tracking-wider">Configure specific requirements for this department</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-error/10 text-error rounded-lg transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 max-h-[70vh] overflow-y-auto space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Department" required>
                            <Select
                                value={group.department}
                                onChange={v => setGroup({...group, department: v})}
                                options={[
                                    { value: '', label: '-- Select Department --' },
                                    ...departments.map(d => ({ value: d, label: d }))
                                ]}
                            />
                        </InputField>
                        <InputField label="Group Title (Optional)" hint="Overrides the default '[Dept] Internship'">
                            <input type="text" value={group.title} onChange={e => setGroup({...group, title: e.target.value})} 
                                className="admin-input border-outline-variant/20 focus:border-primary/30" placeholder="e.g. IT Summer Program" />
                        </InputField>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputField label="Total Openings for this Department" required>
                            <input type="number" value={group.openings} onChange={e => setGroup({...group, openings: e.target.value})} 
                                className="admin-input border-outline-variant/20 focus:border-primary/30" />
                        </InputField>
                        <InputField label="Skills Required" required hint="Comma separated">
                            <input type="text" value={group.skillsRequired} onChange={e => setGroup({...group, skillsRequired: e.target.value})} 
                                className="admin-input border-outline-variant/20 focus:border-primary/30" />
                        </InputField>
                    </div>

                    <InputField label="Job Description / Expectations" required>
                        <textarea rows={3} value={group.expectations} onChange={e => setGroup({...group, expectations: e.target.value})} 
                            className="admin-input border-outline-variant/20 focus:border-primary/30 resize-none" />
                    </InputField>

                    {internshipType !== 'NON_STIPEND' ? (
                        /* Roles Section */
                        <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/10">
                            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-4">Roles</h3>
                            <div className="flex gap-4 mb-4">
                                <input type="text" placeholder="Role Name" value={roleInput.name} onChange={e => setRoleInput({...roleInput, name: e.target.value})} className="admin-input flex-1" />
                                <input type="number" placeholder="Openings" value={roleInput.openings} onChange={e => setRoleInput({...roleInput, openings: e.target.value})} className="admin-input w-24" />
                                <button onClick={() => {
                                    if(roleInput.name && roleInput.openings) {
                                        setGroup({...group, rolesData: [...group.rolesData, {name: roleInput.name, openings: parseInt(roleInput.openings)}]});
                                        setRoleInput({name: '', openings: 1});
                                    }
                                }} className="bg-primary text-white px-4 rounded-lg font-bold text-[10px] uppercase">Add</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {group.rolesData.map((r, i) => (
                                    <span key={i} className="inline-flex items-center gap-2 px-3 py-1 bg-white border border-outline-variant/20 rounded-lg text-xs font-bold">
                                        {r.name} ({r.openings})
                                        <button onClick={() => setGroup({...group, rolesData: group.rolesData.filter((_, idx) => idx !== i)})} className="text-error"><X size={14}/></button>
                                    </span>
                                ))}
                            </div>
                        </div>
                    ) : (
                        /* Fields Section */
                        <div className="p-6 bg-surface-container-low rounded-xl border border-outline-variant/10 space-y-4">
                            <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-2">Technical Fields</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="text" placeholder="Field Name" value={fieldInput.fieldName} onChange={e => setFieldInput({...fieldInput, fieldName: e.target.value})} className="admin-input" />
                                <input type="number" placeholder="Vacancies" value={fieldInput.vacancies} onChange={e => setFieldInput({...fieldInput, vacancies: e.target.value})} className="admin-input" />
                            </div>
                            <div className="flex gap-4">
                                <input type="text" placeholder="Location" value={locationInput} onChange={e => setLocationInput(e.target.value)} className="admin-input flex-1" />
                                <button onClick={() => {
                                    if(locationInput.trim()){
                                        setFieldInput({...fieldInput, locations: [...fieldInput.locations, locationInput.trim()]});
                                        setLocationInput('');
                                    }
                                }} className="bg-primary/10 text-primary px-4 rounded-lg font-bold text-[10px] uppercase">Add Loc</button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {fieldInput.locations.map((loc, i) => <span key={i} className="px-2 py-1 bg-white rounded text-[10px] font-bold">{loc}</span>)}
                            </div>
                            <button onClick={() => {
                                if(fieldInput.fieldName && fieldInput.vacancies && fieldInput.locations.length > 0) {
                                    setGroup({...group, fields: [...group.fields, fieldInput]});
                                    setFieldInput({fieldName: '', description: '', vacancies: '', locations: []});
                                }
                            }} className="w-full bg-primary text-white py-2 rounded-lg font-bold text-[10px] uppercase">Add Field to Group</button>
                            
                            <div className="space-y-2 mt-4">
                                {group.fields.map((f, i) => (
                                    <div key={i} className="bg-white p-3 rounded-lg border border-outline-variant/10 flex justify-between items-center">
                                        <div>
                                            <p className="text-xs font-bold text-primary uppercase">{f.fieldName} ({f.vacancies} Seats)</p>
                                            <p className="text-[10px] text-outline">{f.locations.join(', ')}</p>
                                        </div>
                                        <button onClick={() => setGroup({...group, fields: group.fields.filter((_, idx) => idx !== i)})} className="text-error"><X size={16}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Custom Questions */}
                    <div className="p-4 bg-surface-container-low rounded-xl border border-outline-variant/10">
                        <h3 className="text-xs font-bold text-primary uppercase tracking-wider mb-4">Custom Questions</h3>
                        <div className="flex gap-4 mb-4">
                            <input type="text" placeholder="Question" value={questionInput} onChange={e => setQuestionInput(e.target.value)} className="admin-input flex-1" />
                            <button onClick={() => {
                                if(questionInput) {
                                    setGroup({...group, customQuestions: [...group.customQuestions, questionInput]});
                                    setQuestionInput('');
                                }
                            }} className="bg-primary text-white px-4 rounded-lg font-bold text-[10px] uppercase">Add</button>
                        </div>
                        <div className="space-y-2">
                            {group.customQuestions.map((q, i) => (
                                <div key={i} className="flex justify-between items-center bg-white p-2 border border-outline-variant/20 rounded text-xs font-bold">
                                    {q}
                                    <button onClick={() => setGroup({...group, customQuestions: group.customQuestions.filter((_, idx) => idx !== i)})} className="text-error"><X size={14}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-outline-variant/10 flex justify-end gap-4 bg-surface-container-low">
                    <button onClick={onClose} className="px-6 py-2 border border-outline-variant/30 rounded-lg font-bold text-[10px] uppercase tracking-widest text-outline">Cancel</button>
                    <button onClick={() => {
                        if(!group.department || !group.openings || !group.skillsRequired) return alert('Fill required fields');
                        if(internshipType !== 'NON_STIPEND' && group.rolesData.length === 0) return alert('Add at least one role');
                        if(internshipType === 'NON_STIPEND' && group.fields.length === 0) return alert('Add at least one field');
                        onSave(group);
                    }} className="px-6 py-2 bg-primary text-white rounded-lg font-bold text-[10px] uppercase tracking-widest shadow-lg">Save Group</button>
                </div>
            </div>
        </div>
    );
};

export default DepartmentGroupModal;

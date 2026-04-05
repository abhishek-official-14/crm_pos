import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import ErrorState from '../../components/common/ErrorState';
import Input from '../../components/common/Input';
import { useAppContext } from '../../context/AppContext';
import { validateEmail, validatePassword, validateRequired } from '../../utils/validators';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loading, errors } = useAppContext();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState('');

  const submit = async (event) => {
    event.preventDefault();
    setSuccess('');

    const nextErrors = {
      name: validateRequired(form.name, 'Name'),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
    };

    if (Object.values(nextErrors).some(Boolean)) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});

    try {
      await register({ fullName: form.name, email: form.email, password: form.password });
      setSuccess('Registration successful. Please sign in.');
      setTimeout(() => navigate('/login'), 600);
    } catch {
      // handled by context error state
    }
  };

  return (
    <form className="form-grid" onSubmit={submit}>
      <Input
        label="Full Name"
        value={form.name}
        onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        error={fieldErrors.name}
      />
      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
        error={fieldErrors.email}
      />
      <Input
        label="Password"
        type="password"
        value={form.password}
        onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
        error={fieldErrors.password}
      />
      <Button type="submit" disabled={loading.auth}>
        {loading.auth ? 'Creating account...' : 'Create Account'}
      </Button>
      {errors.auth && <ErrorState message={errors.auth} />}
      {success && <div className="status success">{success}</div>}
      <p>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </form>
  );
}

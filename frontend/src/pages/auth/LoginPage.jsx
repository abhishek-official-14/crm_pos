import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import ErrorState from '../../components/common/ErrorState';
import Input from '../../components/common/Input';
import { useAppContext } from '../../context/AppContext';
import { validateEmail, validatePassword } from '../../utils/validators';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loading, errors } = useAppContext();
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {
      email: validateEmail(form.email),
      password: validatePassword(form.password),
    };

    if (Object.values(nextErrors).some(Boolean)) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    try {
      await login(form);
      navigate('/dashboard');
    } catch {
      // handled by context error state
    }
  };

  return (
    <form className="form-grid" onSubmit={submit}>
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
        {loading.auth ? 'Signing in...' : 'Sign In'}
      </Button>
      {errors.auth && <ErrorState message={errors.auth} />}
      <p>
        New here? <Link to="/register">Create account</Link>
      </p>
    </form>
  );
}

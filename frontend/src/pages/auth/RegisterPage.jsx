import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { validateEmail, validatePassword, validateRequired } from '../../utils/validators';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});

  const submit = (event) => {
    event.preventDefault();
    const nextErrors = {
      name: validateRequired(form.name, 'Name'),
      email: validateEmail(form.email),
      password: validatePassword(form.password),
    };

    if (Object.values(nextErrors).some(Boolean)) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    navigate('/dashboard');
  };

  return (
    <form className="form-grid" onSubmit={submit}>
      <Input
        label="Full Name"
        value={form.name}
        onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
        error={errors.name}
      />
      <Input
        label="Email"
        type="email"
        value={form.email}
        onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
        error={errors.email}
      />
      <Input
        label="Password"
        type="password"
        value={form.password}
        onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
        error={errors.password}
      />
      <Button type="submit">Create Account</Button>
      <p>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </form>
  );
}

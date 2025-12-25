import { useState } from 'react';

interface OnboardingProps {
    onComplete: () => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
    const [step, setStep] = useState(0);
    const [libraryPath, setLibraryPath] = useState('~/SonexaLibrary');
    const [supabaseUrl, setSupabaseUrl] = useState('');
    const [supabaseKey, setSupabaseKey] = useState('');
    const [skipCloud, setSkipCloud] = useState(true);

    const totalSteps = 4;

    const handleNext = () => {
        if (step < totalSteps - 1) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 0) {
            setStep(step - 1);
        }
    };

    const handleChooseDirectory = async () => {
        if (!window.sonexa) return;
        const selected = await window.sonexa.chooseDirectory();
        if (selected) {
            setLibraryPath(selected);
        }
    };

    const handleComplete = async () => {
        if (!window.sonexa) return;

        // Save settings
        await window.sonexa.setSettings({
            localLibraryPath: libraryPath,
            supabaseUrl: skipCloud ? '' : supabaseUrl,
            onboardingComplete: true,
        });

        // Save Supabase key if provided
        if (!skipCloud && supabaseKey) {
            await window.sonexa.setSecret('supabaseKey', supabaseKey);
        }

        onComplete();
    };

    return (
        <div className="fixed inset-0 bg-sonexa-bg flex items-center justify-center z-50">
            <div className="w-full max-w-xl mx-4">
                {/* Logo */}
                <div className="text-center mb-8">
                    <img
                        src="./icons/Top-Logo-Gold.png"
                        alt="Sonexa"
                        className="w-16 h-16 mx-auto mb-4"
                    />
                </div>

                {/* Progress indicator */}
                <div className="flex justify-center gap-2 mb-8">
                    {Array.from({ length: totalSteps }).map((_, i) => (
                        <div
                            key={i}
                            className={`w-2 h-2 rounded-full transition-colors ${i === step ? 'bg-sonexa-primary' : 'bg-sonexa-border'
                                }`}
                        />
                    ))}
                </div>

                {/* Step content */}
                <div className="bg-sonexa-surface rounded-2xl p-8 border border-sonexa-border">
                    {step === 0 && (
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-white mb-4">
                                Welcome to Sonexa
                            </h2>
                            <p className="text-sonexa-text-muted mb-6">
                                Your private audio library for music and sound effects.
                                Let's set things up in just a few steps.
                            </p>
                            <div className="flex flex-col gap-4 text-left text-sm text-sonexa-text-muted">
                                <div className="flex items-start gap-3">
                                    <span className="text-sonexa-primary">✓</span>
                                    <span>Organize your audio files locally</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-sonexa-primary">✓</span>
                                    <span>Drag & drop to any application</span>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="text-sonexa-primary">✓</span>
                                    <span>Optional cloud sync across devices</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 1 && (
                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">
                                Choose Library Location
                            </h2>
                            <p className="text-sonexa-text-muted mb-6 text-sm">
                                Select where your audio files will be stored. You can change this later in Settings.
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={libraryPath}
                                    onChange={(e) => setLibraryPath(e.target.value)}
                                    className="flex-1 bg-sonexa-bg border border-sonexa-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-sonexa-primary"
                                    placeholder="~/SonexaLibrary"
                                />
                                <button
                                    onClick={handleChooseDirectory}
                                    className="px-4 py-3 bg-sonexa-bg border border-sonexa-border text-white rounded-lg hover:bg-sonexa-surface transition-colors"
                                >
                                    Browse
                                </button>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <h2 className="text-xl font-bold text-white mb-4">
                                Cloud Sync (Optional)
                            </h2>
                            <p className="text-sonexa-text-muted mb-6 text-sm">
                                Connect your Supabase project to sync your library across devices.
                                You can skip this and set it up later.
                            </p>

                            <label className="flex items-center gap-3 mb-6 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={skipCloud}
                                    onChange={(e) => setSkipCloud(e.target.checked)}
                                    className="w-5 h-5 rounded border-sonexa-border accent-sonexa-primary"
                                />
                                <span className="text-white">Skip cloud setup for now</span>
                            </label>

                            {!skipCloud && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm text-sonexa-text-muted mb-2">
                                            Supabase URL
                                        </label>
                                        <input
                                            type="text"
                                            value={supabaseUrl}
                                            onChange={(e) => setSupabaseUrl(e.target.value)}
                                            className="w-full bg-sonexa-bg border border-sonexa-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-sonexa-primary"
                                            placeholder="https://your-project.supabase.co"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm text-sonexa-text-muted mb-2">
                                            Anon Key
                                        </label>
                                        <input
                                            type="password"
                                            value={supabaseKey}
                                            onChange={(e) => setSupabaseKey(e.target.value)}
                                            className="w-full bg-sonexa-bg border border-sonexa-border rounded-lg px-4 py-3 text-white focus:outline-none focus:border-sonexa-primary"
                                            placeholder="eyJhbGciOiJIUzI1NiIs..."
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {step === 3 && (
                        <div className="text-center">
                            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-sonexa-primary/20 flex items-center justify-center">
                                <svg className="w-8 h-8 text-sonexa-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-white mb-4">
                                You're All Set!
                            </h2>
                            <p className="text-sonexa-text-muted mb-6 text-sm">
                                Sonexa is ready to use. Start by importing your first audio files
                                using drag & drop or press <kbd className="px-2 py-1 bg-sonexa-bg rounded text-xs">⌘O</kbd> to browse.
                            </p>
                            <div className="text-left text-sm text-sonexa-text-muted bg-sonexa-bg rounded-lg p-4">
                                <p className="font-medium text-white mb-2">Quick tips:</p>
                                <ul className="space-y-1">
                                    <li>• Press <kbd className="px-1 bg-sonexa-surface rounded text-xs">⌘,</kbd> for Settings</li>
                                    <li>• Drag files out to use them in other apps</li>
                                    <li>• Star your favorites for quick access</li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation buttons */}
                <div className="flex justify-between mt-6">
                    <button
                        onClick={handleBack}
                        className={`px-6 py-3 rounded-xl transition-colors ${step === 0
                                ? 'text-transparent cursor-default'
                                : 'text-sonexa-text-muted hover:text-white'
                            }`}
                        disabled={step === 0}
                    >
                        Back
                    </button>

                    {step < totalSteps - 1 ? (
                        <button
                            onClick={handleNext}
                            className="px-8 py-3 bg-sonexa-primary hover:bg-sonexa-primary/90 text-white font-medium rounded-xl transition-colors"
                        >
                            Continue
                        </button>
                    ) : (
                        <button
                            onClick={handleComplete}
                            className="px-8 py-3 bg-sonexa-primary hover:bg-sonexa-primary/90 text-white font-medium rounded-xl transition-colors"
                        >
                            Get Started
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

import React from 'react';
import { SourceProvider } from './context/SourceContext';
import { ReaderProvider } from './context/ReaderContext';
import { ExplorerProvider } from './context/ExplorerContext';
import { LightboxProvider } from './context/LightboxContext';
import { Layout } from './components/layout/Layout';

export const App: React.FC = () => {
  return (
    <SourceProvider>
      <ReaderProvider>
        <ExplorerProvider>
          <LightboxProvider>
            <Layout />
          </LightboxProvider>
        </ExplorerProvider>
      </ReaderProvider>
    </SourceProvider>
  );
};

export default App;

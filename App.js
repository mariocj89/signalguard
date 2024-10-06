import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { MaterialIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { AppRegistry } from 'react-native';
import { name as appName } from './app.json';

export default function App() {
  const [isConnected, setIsConnected] = useState(true);
  const [isPhoneConnected, setIsPhoneConnected] = useState(true);
  const [debounceTimeout, setDebounceTimeout] = useState(null);
  const [phoneDebounceTimeout, setPhoneDebounceTimeout] = useState(null);
  const [internetHistory, setInternetHistory] = useState([]);
  const [phoneHistory, setPhoneHistory] = useState([]);
  const [internetExpanded, setInternetExpanded] = useState(false);
  const [phoneExpanded, setPhoneExpanded] = useState(false);
  const [highlightedEntries, setHighlightedEntries] = useState([]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const timestamp = new Date().toLocaleString();

      if (state.isConnected) {
        if (debounceTimeout) {
          clearTimeout(debounceTimeout);
          setDebounceTimeout(null);
        }
        if (!isConnected) {
          setIsConnected(true);
          addHistoryEntry(setInternetHistory, { status: 'Connected', timestamp }, 'green');
        }
      } else {
        if (!debounceTimeout) {
          const timeout = setTimeout(() => {
            if (isConnected) {
              setIsConnected(false);
              addHistoryEntry(setInternetHistory, { status: 'Disconnected', timestamp }, 'red');
            }
          }, 5000);
          setDebounceTimeout(timeout);
        }
      }

      const phoneStatus = state.isConnected && state.type === 'cellular';
      if (phoneStatus) {
        if (phoneDebounceTimeout) {
          clearTimeout(phoneDebounceTimeout);
          setPhoneDebounceTimeout(null);
        }
        if (!isPhoneConnected) {
          setIsPhoneConnected(true);
          addHistoryEntry(setPhoneHistory, { status: 'Connected', timestamp }, 'green');
        }
      } else {
        if (!phoneDebounceTimeout) {
          const timeout = setTimeout(() => {
            if (isPhoneConnected) {
              setIsPhoneConnected(false);
              addHistoryEntry(setPhoneHistory, { status: 'Disconnected', timestamp }, 'red');
            }
          }, 5000);
          setPhoneDebounceTimeout(timeout);
        }
      }
    });

    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      if (phoneDebounceTimeout) {
        clearTimeout(phoneDebounceTimeout);
      }
      unsubscribe();
    };
  }, [debounceTimeout, phoneDebounceTimeout, isConnected, isPhoneConnected]);

  const addHistoryEntry = (setHistory, entry, color) => {
    setHistory(prev => [entry, ...prev]);
    setHighlightedEntries(prev => [...prev, { ...entry, color }]);
    setTimeout(() => {
      setHighlightedEntries(prev => prev.filter(e => e.timestamp !== entry.timestamp));
    }, 10000);
  };

  const renderHistory = (history) => {
    return history.map((entry, index) => {
      const isHighlighted = highlightedEntries.some(e => e.timestamp === entry.timestamp);
      const color = isHighlighted ? highlightedEntries.find(e => e.timestamp === entry.timestamp).color : '#333';
      return (
        <Text key={index} style={[styles.historyText, { color }]}>{entry.timestamp}: {entry.status}</Text>
      );
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image source={{ uri: 'https://via.placeholder.com/40' }} style={styles.icon} />
        <Text style={styles.title}>SignalGuard</Text>
      </View>
      <TouchableOpacity onPress={() => setInternetExpanded(!internetExpanded)} style={styles.statusContainer}>
        <Text style={styles.statusText}>Internet Connection:</Text>
        <MaterialIcons
          name={isConnected ? 'wifi' : 'wifi-off'}
          size={24}
          color={isConnected ? 'green' : 'red'}
        />
        <MaterialIcons
          name={internetExpanded ? 'expand-less' : 'expand-more'}
          size={24}
          color="black"
        />
      </TouchableOpacity>
      {internetExpanded && (
        <ScrollView style={styles.historyContainer}>
          {renderHistory(internetHistory)}
        </ScrollView>
      )}

      <TouchableOpacity onPress={() => setPhoneExpanded(!phoneExpanded)} style={styles.statusContainer}>
        <Text style={styles.statusText}>Phone Data:</Text>
        <MaterialIcons
          name={isPhoneConnected ? 'signal-cellular-4-bar' : 'signal-cellular-off'}
          size={24}
          color={isPhoneConnected ? 'green' : 'red'}
        />
        <MaterialIcons
          name={phoneExpanded ? 'expand-less' : 'expand-more'}
          size={24}
          color="black"
        />
      </TouchableOpacity>
      {phoneExpanded && (
        <ScrollView style={styles.historyContainer}>
          {renderHistory(phoneHistory)}
        </ScrollView>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    width: 40,
    height: 40,
    marginRight: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
    width: '100%',
  },
  statusText: {
    fontSize: 18,
    marginRight: 10,
    flex: 1,
  },
  historyContainer: {
    width: '100%',
    maxHeight: 150,
    marginBottom: 20,
    backgroundColor: '#fff',
    borderRadius: 5,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  historyText: {
    fontSize: 14,
    color: '#333',
  },
});

AppRegistry.registerComponent(appName, () => App);
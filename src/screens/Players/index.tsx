import { useRoute, useNavigation } from '@react-navigation/native';

import {Alert, FlatList, TextInput} from 'react-native';
import {useState, useEffect, useRef } from 'react';

import {Container, Form, HeaderList, NumberOfPlayers} from "./styles"

import { Highlight } from "@components/Highlight";
import { Header } from "@components/Header";
import { ButtonIcon } from "@components/ButtonIcon";
import { Input } from "@components/Input";
import { Filter } from "@components/Filter";
import { PlayerCard } from '@components/PlayerCard';
import { ListEmpty } from '@components/ListEmpty';
import { Button } from '@components/Button';
import { AppError } from '@utils/AppError';
import { playerAddByGroup } from '@storage/player/playerAddByGroup';
import { PlayerStorageDTO } from '@storage/player/PlayerStorageDTO';
import { playersGetByGroupAndTeam } from '@storage/player/playersGetByGroupAndTeam';
import { playerRemoveByGroup } from '@storage/player/playerRemoveByGroup';
import { groupRemoveByName } from '@storage/group/groupRemoveByName';
import { Loading } from '@components/Loading';

type RouteParams = {
  group: string;
}

export function Players() {
  const [ isLoading, setIsLoading ] = useState(true);
  const [ newPlayerName, setNewPlayerName ] = useState('');
  const [ team, setTeam ] = useState('Time A');
  const [ players, setPlayers ] = useState<PlayerStorageDTO[]>([] );

  const navigation = useNavigation();
  const route = useRoute();
  const { group } = route.params as RouteParams;

  const newPlayerNameInputRef = useRef<TextInput>(null);

  async function handleAddPlayer() {
    if (newPlayerName.trim().length === 0) {
      return Alert.alert('Nova pessoa', 'informe o nome da pessoa para adicionar.');
    }
    const newPlayer = {
      name : newPlayerName,
      team,
    }
    try {
      await playerAddByGroup(newPlayer, group);

      newPlayerNameInputRef.current?.blur();

      setNewPlayerName('');
      fetchPlayersByTeam();

    } catch (error) {
      if(error instanceof AppError) {
        Alert.alert('Nova pessoa', error.message);
      }else{
        Alert.alert('Nova pessoa', 'Não foi possível adicionar');
        console.log(error);
      }
    }
  }

  async function fetchPlayersByTeam() {
    try{
      setIsLoading(true);

      const playersByTeam = await playersGetByGroupAndTeam(group, team);
      setPlayers(playersByTeam);
      
    } catch (error) {
      console.log(error);
      Alert.alert('Pessoas', 'Não foi possível carregar as pessoas');
    }finally {
      setIsLoading(false);
    }
  }

  async function handlePlayerRemove(playerName: string) {
    try{
      await playerRemoveByGroup(playerName, group);
      fetchPlayersByTeam();
    }catch (error) {
      console.log(error);
      Alert.alert('Remover pessoa', 'Não foi possível remover essa pessoa.');
    }
  }

  async function removeGroup() {
    try{
      await groupRemoveByName(group);
      navigation.navigate('groups');
    }catch (error) {
      console.log(error);
      Alert.alert('Remover grupo', 'Não foi possível remover a grupo.');
    }
  }

  async function handleGroupRemove() {
    Alert.alert(
      'Remover turma',
      'Deseja remover a turma?',
      [
        { text: 'Não', style: 'cancel' },
        { text: 'Sim', onPress: () => removeGroup() }
      ]
    );
  }
  
  useEffect(() => {
    fetchPlayersByTeam();
  }, [team]);

  return (
    <Container>
      <Header showBackButton/>

      <Highlight
        title={group}
        subtitle="Adicione a galera e separe os times"
      />
      <Form>
        <Input
          inputRef={newPlayerNameInputRef}
          onChangeText={setNewPlayerName}
          value={newPlayerName}
          placeholder="Nome da pessoa"
          autoCorrect={false}
          onSubmitEditing={handleAddPlayer}
          returnKeyType='done'
        />

        <ButtonIcon 
          icon="add"
          onPress={handleAddPlayer}  
        />
      </Form>

      <HeaderList>
        <FlatList
          data={['Time A', 'Time B']}
          keyExtractor={item => item}
          renderItem={({ item }) => (
            <Filter
              title={item}
              isActive={item === team}
              onPress={() => setTeam(item)}
            />
          )}
          horizontal
        />
        
        <NumberOfPlayers>
          {players.length}
        </NumberOfPlayers>
      </HeaderList>

    { isLoading ? <Loading /> :
      <FlatList
        data={players}
        keyExtractor={item => item.name}
        renderItem={({ item }) => (
          <PlayerCard 
            name={item.name}
            onRemove={() => handlePlayerRemove(item.name)}
          />
        )}
        ListEmptyComponent={() => (
          <ListEmpty
            message="Não há pessoas nesse time"
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          { paddingBottom: 100 },
          players.length === 0 && { flex: 1 }
        ]}
      />
    }

      <Button
        title="Remover turma"
        type="SECONDARY"
        onPress={handleGroupRemove}
      />
    </Container>
  );
}
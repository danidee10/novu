import * as sinon from 'sinon';
import { MessageRepository } from '@novu/dal';
import { ExternalServicesRoute } from './external-services-route.usecase';
import { ExternalServicesRouteCommand } from './external-services-route.command';
import { WSGateway } from '../../ws.gateway';

describe('ExternalServicesRoute', () => {
  let externalServicesRoute: ExternalServicesRoute;
  let wsGatewayStub;
  let messageRepository: MessageRepository;

  beforeEach(() => {
    wsGatewayStub = {
      sendMessage: sinon.stub(),
      server: {
        sockets: {
          in: sinon.stub().returns({
            fetchSockets: sinon.stub().resolves([{ id: 'socketId' }]),
          }),
        },
      },
    } as WSGateway;

    messageRepository = new MessageRepository();

    externalServicesRoute = new ExternalServicesRoute(wsGatewayStub, messageRepository);
  });

  it('should send unseen count change when event is "unseen_count_changed"', async () => {
    const messageRepositoryStub = sinon.stub(MessageRepository.prototype, 'getCount').resolves(Promise.resolve(5));

    await externalServicesRoute.execute(
      ExternalServicesRouteCommand.create({
        event: 'unseen_count_changed',
        userId: 'userId',
        _environmentId: 'envId',
        payload: {},
      })
    );

    sinon.assert.calledOnceWithExactly(wsGatewayStub.sendMessage, 'userId', 'unseen_count_changed', {
      unseenCount: 5,
    });

    messageRepositoryStub.restore();
  });

  it('should send unread count change when event is "unread_count_changed"', async () => {
    const messageRepositoryStub = sinon.stub(MessageRepository.prototype, 'getCount').resolves(Promise.resolve(10));

    await externalServicesRoute.execute(
      ExternalServicesRouteCommand.create({
        event: 'unread_count_changed',
        userId: 'userId',
        _environmentId: 'envId',
        payload: {},
      })
    );

    sinon.assert.calledOnceWithExactly(wsGatewayStub.sendMessage, 'userId', 'unread_count_changed', {
      unreadCount: 10,
    });

    messageRepositoryStub.restore();
  });

  it('should send general message when event is neither "unseen_count_changed" nor "unread_count_changed"', async () => {
    const messageRepositoryStub = sinon.stub(MessageRepository.prototype, 'getCount').resolves(Promise.resolve(10));

    const command: ExternalServicesRouteCommand = {
      event: 'notification_received',
      userId: 'userId',
      payload: { data: 'payloadData' },
    };

    await externalServicesRoute.execute(command);

    sinon.assert.calledOnceWithExactly(wsGatewayStub.sendMessage, 'userId', 'notification_received', {
      data: 'payloadData',
    });

    messageRepositoryStub.restore();
  });

  it('should skip getCount query if unseen count provided', async () => {
    let messageRepositoryStub = sinon.stub(MessageRepository.prototype, 'getCount').resolves(Promise.resolve(10));
    let command: ExternalServicesRouteCommand = {
      event: 'unseen_count_changed',
      userId: 'userId',
      _environmentId: 'envId',
      payload: { unseenCount: 5 },
    };
    await externalServicesRoute.execute(command);
    sinon.assert.calledOnceWithExactly(wsGatewayStub.sendMessage, 'userId', 'unseen_count_changed', {
      unseenCount: 5,
    });
    messageRepositoryStub.restore();

    messageRepositoryStub = sinon.stub(MessageRepository.prototype, 'getCount').resolves(Promise.resolve(10));
    command = {
      event: 'unseen_count_changed',
      userId: 'userId',
      _environmentId: 'envId',
      payload: { unseenCount: '4' },
    };
    await externalServicesRoute.execute(command);
    sinon.assert.calledWithMatch(wsGatewayStub.sendMessage.getCall(1), 'userId', 'unseen_count_changed', {
      unseenCount: 4,
    });
    messageRepositoryStub.restore();

    messageRepositoryStub = sinon.stub(MessageRepository.prototype, 'getCount').resolves(Promise.resolve(20));
    command = {
      event: 'unseen_count_changed',
      userId: 'userId',
      _environmentId: 'envId',
    } as any;
    await externalServicesRoute.execute(command);
    sinon.assert.calledWithMatch(wsGatewayStub.sendMessage.getCall(2), 'userId', 'unseen_count_changed', {
      unseenCount: 20,
    });
    messageRepositoryStub.restore();

    messageRepositoryStub = sinon.stub(MessageRepository.prototype, 'getCount').resolves(Promise.resolve(21));
    command = {
      event: 'unseen_count_changed',
      userId: 'userId',
      _environmentId: 'envId',
      payload: { unseenCount: null },
    };
    await externalServicesRoute.execute(command);
    sinon.assert.calledWithMatch(wsGatewayStub.sendMessage.getCall(3), 'userId', 'unseen_count_changed', {
      unseenCount: 21,
    });
    messageRepositoryStub.restore();

    messageRepositoryStub = sinon.stub(MessageRepository.prototype, 'getCount').resolves(Promise.resolve(22));
    command = {
      event: 'unseen_count_changed',
      userId: 'userId',
      _environmentId: 'envId',
      payload: { unseenCount: undefined },
    };
    await externalServicesRoute.execute(command);
    sinon.assert.calledWithMatch(wsGatewayStub.sendMessage.getCall(4), 'userId', 'unseen_count_changed', {
      unseenCount: 22,
    });
    messageRepositoryStub.restore();

    messageRepositoryStub = sinon.stub(MessageRepository.prototype, 'getCount').resolves(Promise.resolve(23));
    command = {
      event: 'unseen_count_changed',
      userId: 'userId',
      _environmentId: 'envId',
      payload: { unseenCount: 0 },
    };
    await externalServicesRoute.execute(command);
    sinon.assert.calledWithMatch(wsGatewayStub.sendMessage.getCall(5), 'userId', 'unseen_count_changed', {
      unseenCount: 0,
    });
    messageRepositoryStub.restore();
  });

  it('should skip getCount query if unread count provided', async () => {
    let messageRepositoryStub = sinon.stub(MessageRepository.prototype, 'getCount').resolves(Promise.resolve(10));
    let command: ExternalServicesRouteCommand = {
      event: 'unread_count_changed',
      userId: 'userId',
      _environmentId: 'envId',
      payload: { unreadCount: 5 },
    };
    await externalServicesRoute.execute(command);
    sinon.assert.calledOnceWithExactly(wsGatewayStub.sendMessage, 'userId', 'unread_count_changed', {
      unreadCount: 5,
    });
    messageRepositoryStub.restore();

    messageRepositoryStub = sinon.stub(MessageRepository.prototype, 'getCount').resolves(Promise.resolve(10));
    command = {
      event: 'unread_count_changed',
      userId: 'userId',
      _environmentId: 'envId',
      payload: { unreadCount: '4' },
    };
    await externalServicesRoute.execute(command);
    sinon.assert.calledWithMatch(wsGatewayStub.sendMessage.getCall(1), 'userId', 'unread_count_changed', {
      unreadCount: 4,
    });
    messageRepositoryStub.restore();

    messageRepositoryStub = sinon.stub(MessageRepository.prototype, 'getCount').resolves(Promise.resolve(20));
    command = {
      event: 'unread_count_changed',
      userId: 'userId',
      _environmentId: 'envId',
    } as any;
    await externalServicesRoute.execute(command);
    sinon.assert.calledWithMatch(wsGatewayStub.sendMessage.getCall(2), 'userId', 'unread_count_changed', {
      unreadCount: 20,
    });
    messageRepositoryStub.restore();

    messageRepositoryStub = sinon.stub(MessageRepository.prototype, 'getCount').resolves(Promise.resolve(21));
    command = {
      event: 'unread_count_changed',
      userId: 'userId',
      _environmentId: 'envId',
      payload: { unreadCount: null },
    };
    await externalServicesRoute.execute(command);
    sinon.assert.calledWithMatch(wsGatewayStub.sendMessage.getCall(3), 'userId', 'unread_count_changed', {
      unreadCount: 21,
    });
    messageRepositoryStub.restore();

    messageRepositoryStub = sinon.stub(MessageRepository.prototype, 'getCount').resolves(Promise.resolve(22));
    command = {
      event: 'unread_count_changed',
      userId: 'userId',
      _environmentId: 'envId',
      payload: { unreadCount: undefined },
    };
    await externalServicesRoute.execute(command);
    sinon.assert.calledWithMatch(wsGatewayStub.sendMessage.getCall(4), 'userId', 'unread_count_changed', {
      unreadCount: 22,
    });
    messageRepositoryStub.restore();

    messageRepositoryStub = sinon.stub(MessageRepository.prototype, 'getCount').resolves(Promise.resolve(23));
    command = {
      event: 'unread_count_changed',
      userId: 'userId',
      _environmentId: 'envId',
      payload: { unreadCount: 0 },
    };
    await externalServicesRoute.execute(command);
    sinon.assert.calledWithMatch(wsGatewayStub.sendMessage.getCall(5), 'userId', 'unread_count_changed', {
      unreadCount: 0,
    });
    messageRepositoryStub.restore();
  });
});
